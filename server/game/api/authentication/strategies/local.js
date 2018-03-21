import LocalStrategy from 'passport-local';
import UserModel from '../../models/user';
import passwordResetEmail from '../../../data/emails/passwordReset.js';
import newPasswordEmail from '../../../data/emails/passwordNew.js';
import uuid from 'uuid/v4';
import crypto from 'crypto';

let logger;

/**
 * Setup the authentication strategy
 * @param  {Passport} passport  Passport Object
 * @param  {Logger}   loggerObj The logger
 */
export function setup(passport, loggerObj) {
    logger = loggerObj;

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
    UserModel.findOne(
        {email: escape(email)},
        {email: 1, password: 1, activated: 1, session_token: 1},
        async (err, user) => {
            if (err) {
                logger.error(err);
                return done('Something went wrong, please try again in a moment.');
            }

            if (!user) {
                return done('Invalid email and password combination.');
            }

            if (!user.activated) {
                // TODO: write a custom callback fuction for handling errors.
                return done('Your account has not been activated. Please click the activation link sent to your email address.');
            }

            const same = await user.verifyPassword(password);

            if (!same) {
                return done('Invalid email and password combination.');
            }

            return done(null, {
                user: user.toObject(),
                identity: {},
            });
        }
    );
}

/**
 * Handle password reset confirmation links
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function resetConfirm(req, res) {
    if (!req.query.token || !req.query.token.length) {
        return res.status(400).json({
            status: 400,
            error: 'Missing or invalid reset token.',
        });
    }

    if (req.query.token.length !== 64) {
        return res.status(400).json({
            status: 400,
            error: 'Missing or invalid reset token.',
        });
    }

    UserModel.findOne({_id: escape(req.params.userId)}, (err, user) => {
        if (err) {
            logger.error(err);
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        if (!user) {
            return res.status(400).json({
                status: 400,
                error: 'Missing or invalid reset token.',
            });
        }

        if (!user.passwordReset || user.passwordReset.created < new Date().getTime() - (4 * 60 * 60 * 1000)) {
            return res.status(400).json({
                status: 400,
                error: 'Missing or invalid reset token.',
            });
        }

        if (user.passwordReset.token !== req.query.token) {
            return res.status(400).json({
                status: 400,
                error: 'Missing or invalid reset token.',
            });
        }

        // generate the password reset token
        const passwordLength = req.app.get('config').api.authentication.password.minlen;
        let newPassword = crypto.createHash('sha1');
        newPassword.update(uuid());
        newPassword = newPassword.digest('hex').substr(0, passwordLength);

        user.password = newPassword;
        user.passwordReset = null;
        // if they clicked the reset link, they would essentially have confirmed the email is reachable
        user.activated = true;

        user.save((err) => {
            if (err) {
                logger.error(err);
                return res.status(500).json({
                    status: 500,
                    error: 'Sometihng went wrong. Please try again in a moment.',
                });
            }

            const mailer = req.app.get('mailer');

             // setup email data with unicode symbols
            let mailOptions = {
                from: req.app.get('config').mailserver.sender,
                to: user.email,
                subject: newPasswordEmail.title,
                html: newPasswordEmail.body(newPassword),
            };

            // send mail with defined transport object
            mailer.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return logger.error(error);
                }

                return res.status(200).json({
                    status: 200,
                    message: 'Password reset successfully! A new password has been sent to your email.',
                });
            });
        });
    });
}

/**
 * Handles password reset requests
 * @param {Express Request}  req
 * @param {Express Response} res
 */
export function passwordReset(req, res) {
    if (!req.body.email || !req.body.email.includes('@')) {
        return res.status(400).json({
            status: 400,
            error: 'Please enter a valid email address',
        });
    }

    UserModel.findOne(
        {email: escape(req.body.email)},
        async (err, user) => {
            if (err) {
                logger.error(err);
                return res.status(500).json({
                    status: 200,
                    message: 'Something went wrong, please try again in a moment.',
                });
            }

            if (!user) {
                return res.json({
                    status: 200,
                    message: 'If the email you entered was valid, you should receive a reset link momentarily!',
                });
            }

            // check if we already sent an email in the last 15 mins
            if (user.passwordReset && user.passwordRset.created > new Date().getTime() - (15 * 60 * 1000)) {
                return res.json({
                    status: 200,
                    message: 'If the email you entered was valid, you should receive a reset link momentarily!',
                });
            }

            // generate the password reset token
            let token = crypto.createHmac('sha256', req.app.get('config').api.signingKey);
            token.update(uuid());

            // create the password reset object, store in the user model.
            let resetObject = {
                token: token.digest('hex'),
                created: new Date().getTime(),
            };

            user.passwordReset = resetObject;
            user.save((err) => {
                const mailer = req.app.get('mailer');
                const link = `http${req.secure ? 's' : ''}//${req.headers.host}/api/auth/reset/${user._id.toString()}?token=${resetObject.token}`;

                 // setup email data with unicode symbols
                let mailOptions = {
                    from: req.app.get('config').mailserver.sender,
                    to: user.email,
                    subject: passwordResetEmail.title,
                    html: passwordResetEmail.body(link, req.connection.remoteAddress),
                };

                // send mail with defined transport object
                mailer.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return logger.error(error);
                    }

                    res.status(200).json({
                        status: 200,
                        message: 'If the email you entered was valid, you should receive a reset link momentarily!',
                    });
                });
            });
        }
    );
}
