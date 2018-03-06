import GithubStrategy from 'passport-github';
import AccountModel from '../../models/account';
import IdentityModel from '../../models/identity';

let logger;

/**
 * Setup the authentication strategy
 * @param  {Passport} passport     Passport Object
 * @param  {String}   clientId     App client ID
 * @param  {String}   clientSecret App Client Secret
 * @param  {String}   callbackUrl  App callback url
 */
function setup(passport, clientId, clientSecret, callbackUrl, loggerObj) {
    logger = loggerObj

    //setup the stategies we want
    passport.use(new GithubStrategy({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackUrl,
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
                const account = await signup();
                identity = await createIdentity(profile.provider, profile.id, account._id.toString());
            } catch (err) {
                logger.error(err);
                return cb('Something went wrong, please try again in a moment.');
            }
        }

        // load the account data, associated with the identity
        AccountModel.findOne({_id: escape(identity.account)}, {_id: 1, session_token: 1}, async (err, account) => {
            if (err) {
                logger.error(err);
                return cb('Something went wrong, please try again in a moment.');
            }

            // if the account was deleted, create a new account
            if (!account) {
                const account = await signup();
                identity.account = account._id.toString();

                try {
                    // update the identity with the new account id
                    await identity.saveAsync();
                } catch (err) {
                    logger.error(err);
                    return cb('Something went wrong, please try again in a moment.');
                }
            }

            return cb(null, account.toObject());
        });
    });
}

/**
 * Handles account creation with this strategy
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
async function createIdentity(provider, providerId, accountId) {
    const newIdentity = new IdentityModel({
        provider,
        providerId,
        account: accountId,
    });
    await newIdentity.save();
    return newIdentity;
}

/**
 * Handles account creation with this strategy
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
async function signup() {
    const newAccount = new AccountModel({});
    await newAccount.save();
    return newAccount;
}

module.exports = {
    setup,
};
