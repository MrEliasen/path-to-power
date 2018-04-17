import activationEmail from 'config/emails/activation.js';
import verificationEmail from 'config/emails/verification.js';
import IdentityModel from '../models/identity';
import UserModel from '../models/user';
import CharacterModel from '../../components/character/model';
import ItemModel from '../../components/item/model';
import FactionModel from '../../components/faction/model';
import uuid from 'uuid/v4';
import crypto from 'crypto';

/**
 * Check if the specified email is already in use
 * @param  {String} email The email to check
 * @return {Number|Boolean} 500 on error, otherwise boolean 
 */
async function checkEmailExists(email, logger) {
    try {
        const user = await UserModel.findOneAsync({email: escape(email)});
        return user ? true : false;
    } catch (err) {
        logger.error(err);
        return 500;
    }
}

/**
 * Handles updates to a user
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function updateUser(req, res) {
    UserModel.findOne({_id: req.user._id}, async (err, user) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        // Update of user email
        if (req.body.email) {
            if (!req.body.email.includes('@')) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid email. Please make sure the email is valid as it will be used for logging in and resetting your password should you ever need to.',
                });
            }

            if (req.body.email !== user.email) {
                const conflict = await checkEmailExists(req.body.email, req.app.get('logger'));

                // check if an error occured
                if (conflict === 500) {
                    return res.status(500).json({
                        status: 500,
                        error: 'Something went wrong. Please try again in a moment.',
                    });
                }

                // If the email was already in use
                if (conflict) {
                    return res.status(409).json({
                        status: 409,
                        error: 'An account is already signed up using that email.',
                    });
                }

                const token = crypto.createHmac('sha256', req.app.get('config').security.signingSecret);
                token.update(uuid());

                user.newEmail = req.body.email;
                user.activationToken = token.digest('hex');
            }
        }

        // Update of user password
        if (req.body.password) {
            if (!req.user.email && !user.newEmail) {
                return res.status(400).json({
                    status: 400,
                    error: 'You cannot set a password for your account, without also adding an email address.',
                });
            }

            const minLen = req.app.get('config').security.password.minlen;
            if (req.body.password.length < minLen) {
                return res.status(400).json({
                    status: 400,
                    error: `Your password must be at least ${minLen} characters long.`,
                });
            }

            if (req.body.password !== req.body.passwordConfirm) {
                return res.status(400).json({
                    status: 400,
                    error: 'Your passwords did not seem to match.',
                });
            }

            // verify the current password, if one already exists on the account
            if (user.password) {
                const validPassword = await user.verifyPassword(req.body.currentPassword);

                if (!validPassword) {
                    return res.status(400).json({
                        status: 400,
                        error: 'The current password you entered does not match the one on your account.',
                    });
                }
            }

            user.password = req.body.password;
        }

        user.save((err) => {
            if (err) {
                return res.status(500).json({
                    status: 500,
                    error: 'Something went wrong. Please try again in a moment.',
                });
            }

            // check if the email has been updated, if so, send activation email.
            if (user.newEmail) {
                const mailer = req.app.get('mailer');
                const link = `http${req.secure ? 's' : ''}://${req.headers.host}/api/users/${user._id.toString()}/verify?token=${user.activationToken}`;

                 // setup email data with unicode symbols
                let mailOptions = {
                    from: req.app.get('config').mail.sender,
                    to: user.newEmail,
                    subject: verificationEmail.title,
                    html: verificationEmail.body(link),
                };

                // send mail with defined transport object
                return mailer.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        req.app.get('logger').error(error);
                        return res.status(500).json({
                            status: 500,
                            error: 'Something went wrong. Please try again in a moment.',
                        });
                    }

                    res.status(200).json({
                        status: 200,
                        message: 'Your details has been updated! To verify your new email, please click the verification link sent to your new email address.',
                    });
                });
            }

            return res.status(200).json({
                email: user.email || '',
                hasPassword: user.password ? true : false,
            });
        });
    });
}

/**
 * Handles user deletions
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export async function deleteUser(req, res) {
    try {
        const user = await UserModel.findOneAsync({ _id: req.user._id });

        if (!user) {
            return res.status(401).json({
                status: 401,
                error: 'Invalid authentication token.',
            });
        }

        const characters = await CharacterModel.findAsync({user_id: user._id.toString()});

        if (characters) {
            const characterIDs = characters.map((obj) => {
                return obj._id.toString();
            });

            const factions = await FactionModel.findAsync({leader_id: {$in: characterIDs}});

            if (factions && factions.length > 0) {
                return res.status(400).json({
                    status: 400,
                    error: 'You cannot delete your account while one or more of your characters are the leader of a faction.',
                });
            }

            await ItemModel.deleteManyAsync({ character_id: { $in: characterIDs } });
            await Promise.all(characters.map((obj) => obj.removeAsync()));
        }

        await IdentityModel.deleteManyAsync({ userId: user._id });
        await user.removeAsync();

        return res.json({
            status: 200,
        });
    } catch (err) {
        req.app.get('logger').error(err);

        return res.status(500).json({
            status: 500,
            error: 'Something went wrong. Please try again in a moment.',
        });
    }
}

/**
 * Handles user fetch
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export async function getUser(req, res) {
    try {
        const identities = await IdentityModel.findAsync(
            {userId: req.user._id},
            { _id: 0, provider: 1, providerId: 1, date_added: 1}
        );

        res.json({
            status: 200,
            user: {
                _id: req.user._id.toString(),
                email: req.user.email || '',
                date_added: req.user.date_added,
                hasPassword: req.user.password,
                identities,
            },
        });
    } catch (err) {
        req.app.get('logger').error(err);

        return res.status(500).json({
            status: 500,
            error: 'Something went wrong. Please try again in a moment.',
        });
    }
}

/**
 * Handles user creation with this strategy
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function createUser(req, res) {
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

    if (req.body.password !== req.body.passwordConfirm) {
        return res.status(400).json({
            status: 400,
            error: 'Your passwords did not seem to match.',
        });
    }

    const minLen = req.app.get('config').security.password.minlen;
    if (req.body.password.length < minLen) {
        return res.status(400).json({
            status: 400,
            error: `Your password must be at least ${minLen} characters long.`,
        });
    }

    if (!req.body.email.includes('@')) {
        return res.status(400).json({
            status: 400,
            error: 'Please enter a valid email address',
        });
    }

    UserModel.findOne({email: escape(req.body.email)}, (err, user) => {
        if (err) {
            req.app.get('logger').error(err);
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong while trying to process your request. Please try again in a moment.',
                err: err,
            });
        }

        // Email already in use
        if (user) {
            return res.status(409).json({
                status: 409,
                error: 'An account is already signed up using that email.',
            });
        }

        const localAuth = req.app.get('config').auth.providers.find((obj) => obj.id === 'local');
        const requireActivation = localAuth.activation_link;
        let newUser;
        let token;

        if (requireActivation) {
            // create activation key
            token = crypto.createHmac('sha256', req.app.get('config').security.signingSecret);
            token.update(uuid());
        }

        newUser = new UserModel({
            email: req.body.email,
            password: req.body.password,
            activationToken: requireActivation ? token.digest('hex') : '',
        });

        newUser.save((err) => {
            if (err) {
                req.app.get('logger').error(err);
                return res.status(500).json({
                    status: 500,
                    error: 'Something went wrong while trying to process your request. Please try again in a moment.',
                    err: err,
                });
            }

            if (!requireActivation) {
                return res.status(203).json({
                    status: 203,
                    message: 'Your account has been created!',
                });
            }

            const mailer = req.app.get('mailer');
            const link = `http${req.secure ? 's' : ''}://${req.headers.host}/api/users/${newUser._id.toString()}/activate?token=${newUser.activationToken}`;

             // setup email data with unicode symbols
            let mailOptions = {
                from: req.app.get('config').mail.sender,
                to: newUser.email,
                subject: activationEmail.title,
                html: activationEmail.body(link),
            };

            // send mail with defined transport object
            mailer.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return req.app.get('logger').error(error);
                }

                res.status(203).json({
                    status: 203,
                    message: 'Your account has been created! To activate your acount, please click the activation link sent to your email address.',
                });
            });
        });
    });
}

/**
 * Handles email update verification requests
 * @param  {Express Request}  req
 * @param  {Express Response} res
 */
export function verifyEmail(req, res) {
    const redirectUrl = `${req.app.get('config').app.clientUrl}/verified`;

    if (!req.query.token || !req.query.token.length) {
        return res.redirect(`${redirectUrl}?error=Missing verification token`);
    }

    if (req.query.token.length !== 64) {
        return res.redirect(`${redirectUrl}?error=Invalid verification token`);
    }

    UserModel.findOne({_id: escape(req.params.userId), activationToken: escape(req.query.token)}, async (err, user) => {
        if (err) {
            return res.redirect(`${redirectUrl}?error=Something went wrong. Please try again in a moment`);
        }

        if (!user || !user.newEmail) {
            return res.redirect(`${redirectUrl}?error=Invalid verification token`);
        }

        const conflict = await checkEmailExists(user.newEmail, req.app.get('logger'));

        // check if an error occured
        if (conflict === 500) {
            return res.redirect(`${redirectUrl}?error=Something went wrong. Please try again in a moment`);
        }

        // If the email was already in use
        if (conflict) {
            return res.redirect(`${redirectUrl}?error=An account is already signed up using that email`);
        }

        // activate the user and remove the token
        user.activationToken = '';
        user.email = user.newEmail;
        user.newEmail = null;

        user.save((err) => {
            if (err) {
                return res.redirect(`${redirectUrl}?error=Sometihng went wrong. Please try again in a moment`);
            }

            res.redirect(`${req.app.get('config').app.clientUrl}/verified`);
        });
    });
}
