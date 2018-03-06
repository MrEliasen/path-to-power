import LocalStrategy from 'passport-local';
import AccountModel from '../../models/account';
import activationEmail from '../../../data/emails/activation.js';
import uuid from 'uuid/v4';
import crypto from 'crypto';

let logger;                                                            

/**
 * Setup the authentication strategy
 * @param  {Passport} passport     Passport Object
 */
function setup(passport, clientId, clientSecret, callbackUrl, loggerObj) {
    logger = loggerObj

    //setup the stategies we want
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        failureFlash: false,
    }, Auth));
}

/**
 * Handles authentication requests
 * @param {String}   email
 * @param {String}   password
 * @param {Function} done
 */
function Auth(email, password, done) {
    AccountModel.findOne({email: escape(email)}, {email: 1, password: 1, activated: 1, session_token: 1}, async (err, account) => {
        if (err) {
            logger.error(err);
            return done('Something went wrong, please try again in a moment.');
        }

        if (!account) {
            return done('Invalid email and password combination.');
        }

        if (!account.activated) {
            // TODO: write a custom callback fuction for handling errors.
            return done('Your account has not been activated. Please click the activation link sent to your email address.');
        }

        const same = await account.verifyPassword(password);

        if (!same) {
            return done('Invalid email and password combination.');
        }

        return done(null, account.toObject());
    });
}

/**
 * Handles account creation with this strategy
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
function signup(req, res) {
    if (!req.body.email) {
        return res.status(400).json({
            status: 400,
            error: 'You must supply an email.',
        });
    }

    if (!req.body.password) {
        return res.status(400).json({
            status: 400,
            error: 'Please choose a password',
        });
    }

    if (req.body.password.length < req.app.get('config').api.authentication.password.minlen) {
        return res.status(400).json({
            status: 400,
            error: 'Your password much be at least 8 characters long.',
        });
    }

    if (!req.body.email.includes('@')) {
        return res.status(400).json({
            status: 400,
            error: 'Please enter a valid email address',
        });
    }

    AccountModel.findOne({email: escape(req.body.email)}, (err, account) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong while trying to process your request. Please try again in a moment.',
                err: err,
            });
        }

        // Email already in use
        if (account) {
            return res.status(409).json({
                status: 409,
                error: 'An account is already signed up using that email.',
            });
        }

        // create activation key
        const token = crypto.createHmac('sha256', req.app.get('config').api.signingKey);
        token.update(uuid());

        const newAccount = new AccountModel({
            email: req.body.email,
            password: req.body.password,
            activationToken: token.digest('hex'),
        });

        newAccount.save((err) => {
            if (err) {
                return res.status(500).json({
                    status: 500,
                    error: 'Something went wrong while trying to process your request. Please try again in a moment.',
                    err: err,
                });
            }

            const mailer = req.app.get('mailer');
            const link = `http${req.secure ? 's' : ''}//${req.headers.host}/api/account/${newAccount._id.toString()}/activate?token=${newAccount.activationToken}`;

             // setup email data with unicode symbols
            let mailOptions = {
                from: req.app.get('config').mailserver.sender,
                to: newAccount.email,
                subject: 'PTP | Account Activation',
                html: activationEmail(link),
            };

            // send mail with defined transport object
            mailer.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return logger.error(error);
                }

                res.status(203).json({
                    status: 203,
                    message: 'Your account has been created! To activate your acount, please click the activation link sent to your email address.',
                });
            });
        });
    });
}

module.exports = {
    setup,
    signup,
};
