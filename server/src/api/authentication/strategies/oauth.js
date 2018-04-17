import UserModel from '../../models/user';
import IdentityModel from '../../models/identity';

let logger;

/**
 * Setup the authentication strategy
 * @param  {Passport} passport  Passport Object
 * @param  {Object}   details   The strategy details, like clientId, secret, callback url etc.
 * @param  {Logger}   loggerObj The logger
 */
export default function setup(passport, details, loggerObj) {
    logger = loggerObj;
    const Strategy = require(`passport-${details.package}`).Strategy;

    if (!details.clientSecret) {
        return logger.error(new Error(`The provider ${details.id} does not have a ${details.id.toUpperCase()}_CLIENT_SECRET defined.`));
    }

    //setup the stategies we want
    passport.use(new Strategy({
        clientID: details.clientID,
        clientSecret: details.clientSecret,
        callbackURL: details.callbackUrl,
    }, Auth));
}

/**
 * Handles authentication requests
 */
function Auth(accessToken, refreshToken, profile, cb) {
    IdentityModel.findOne({provider: escape(profile.provider), providerId: escape(profile.id)}, async (err, identity) => {
        if (err) {
            logger.error(err);
            return cb('Something went wrong, please try again in a moment.');
        }

        if (!identity) {
            try {
                identity = await createIdentity(profile.provider, profile.id);
            } catch (err) {
                logger.error(err);
                return cb('Something went wrong, please try again in a moment.');
            }
        }

        if (!identity.userId) {
            return cb(null, {
                identity,
                user: {},
            });
        }

        // load the user data, associated with the identity
        UserModel.findOne({_id: escape(identity.userId)}, {_id: 1, session_token: 1}, async (err, user) => {
            if (err) {
                logger.error(err);
                return cb('Something went wrong, please try again in a moment.');
            }

            // if the user was deleted, create a new user
            if (!user) {
                user = await createNewUser(identity);

                if (!user) {
                    return cb('Something went wrong, please try again in a moment.');
                }
            }

            return cb(null, {
                identity,
                user: user.toObject(),
            });
        });
    });
}

/**
 * Creates a new user and updates the identity's userId
 * @param  {MongoDB Object} identity The identity up update
 */
async function createNewUser(identity) {
    const newUser = new UserModel({
        activated: true,
    });
    await newUser.saveAsync();

    if (!newUser) {
        return null;
    }

    identity.userId = newUser._id.toString();

    try {
        // update the identity with the new user id
        await identity.saveAsync();
    } catch (err) {
        logger.error(err);
        return null;
    }

    return newUser;
}

/**
 * Handles creation of new OAuth identities
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
async function createIdentity(provider, providerId, userId) {
    const newIdentity = new IdentityModel({
        provider,
        providerId,
        userId: userId || null,
    });
    await newIdentity.save();
    return newIdentity;
}
