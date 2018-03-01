import LocalStrategy from 'passport-local';
import AccountModel from '../../models/account';
import activationEmail from '../../../data/emails/activation.js';
import uuid from 'uuid/v4';
import crypto from 'crypto';

/**
 * Handle local authentication requests
 * @param  {Function} done
 */
function setup(passport) {
    //setup the stategies we want
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    }, LocalAuth));
}

/**
 * Setup local authentication
 * @param  {Passport} passport Passport object
 */
function LocalAuth(username, password, done) {
    AccountModel.findOne({username: escape(username)}, {username: 1, password: 1}, async (err, account) => {
        if (err) {
            return done(err);
        }

        if (!account) {
            return done(null, false);
        }

        const same = await account.verifyPassword(password);

        if (!same) {
            return done(null, false);
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
            const link = `http${req.secure ? 's' : ''}//${req.header.host}/api/account/${newAccount._id.toString()}/activate?token=${newAccount.activationToken}`;

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
                    return console.log(error);
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
