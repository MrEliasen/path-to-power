import passport from 'passport';
import strategies from './strategies';
import config from '../../../config.json';
import AccountModel from '../models/account';

export const createAccount = strategies.local.signup;

/**
 * Handles updates to a user account
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function updateAccount(req, res) {

}

/**
 * Handles account deletions
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function deleteAccount(req, res) {

}

/**
 * Handles account activation requests
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function activateAccount(req, res) {
    if (!req.query.token || !req.query.token.length) {
        return res.status(400).json({
            status: 400,
            error: 'Missing activation token.',
        });
    }

    if (req.query.token.length !== 64) {
        return res.status(400).json({
            status: 400,
            error: 'Invalid activation token.',
        });
    }

    AccountModel.findOne({_id: escape(req.params.userId), activationToken: escape(req.query.token)}, (err, user) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        if (!user) {
            return res.status(400).json({
                status: 400,
                error: 'Invalid activation token.2',
            });
        }

        // activate the account and remove the token
        user.activationToken = '';
        user.activated = true;

        user.save((err) => {
            if (err) {
                return res.status(500).json({
                    status: 500,
                    error: 'Sometihng went wrong. Please try again in a moment.',
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Your account has been activated!',
            });
        });
    });
}

/**
 * Loads the authentication strategies
 * @param  {Express} app
 */
export function loadStrategies(passport) {
    const providers = config.api.authentication.providers;

    for (let provider in providers) {
        if (providers.hasOwnProperty(provider)) {
            if (!strategies[provider]) {
                return console.log(`Provider "${provider}" not found in the list of available strategies.`);
            }

            if (!providers[provider].enabled) {
                return;
            }

            strategies[provider].setup(passport);
        }
    };
}

/**
 * Handles authentication requests
 * @param  {Express Request} req
 * @param  {Express Response} res
 * @return {Function}
 */
export function authenticate(req, res, next) {
    return passport.authenticate(req.body.method, {session: false})(req, res, next);
}

/**
 * Handles successful authentication requests
 * @param  {Express Request} req
 * @param  {Express Reponse} res
 */
export function onAuthSuccess(req, res) {
    // create JWT
    // send JWT back to client
    res.json({
        status: true,
        user: {
            _id: req.user._id,
            username: req.user.username,
        },
    });
}
