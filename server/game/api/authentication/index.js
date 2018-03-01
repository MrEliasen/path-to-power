import passport from 'passport';
import strategies from './strategies';
import config from '../../../config.json';

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
export function authenticate(req, res) {
    return passport.authenticate(req.body.method + '', {session: false});
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
