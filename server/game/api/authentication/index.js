import passport from 'passport';
import strategies from './strategies';
import config from '../../../config.json';
import AccountModel from '../models/account';
import jwt from 'jsonwebtoken';

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
export function loadStrategies(passport, logger) {
    const providers = config.api.authentication.providers;

    for (let provider in providers) {
        if (providers.hasOwnProperty(provider)) {
            if (!strategies[provider]) {
                return logger.error(`Provider "${provider}" not found in the list of available strategies.`);
            }

            if (!providers[provider].enabled) {
                return;
            }

            let callbackUrl = `${config.api.domain}${[80,443].includes(config.api.post) ? '' : `:${config.api.port}`}/api/auth/${provider}/callback`;

            strategies[provider].setup(
                passport,
                providers[provider].clientID,
                providers[provider].clientSecret,
                callbackUrl,
                logger
            );
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
    const method = req.body.method || req.params.provider;

    if (!method) {
        return res.status(400).json({
            status: 400,
            error: 'Invalid authentication method.',
        });
    }

    return passport.authenticate(method, {session: false}, (err, success, info, status) => {
        if (success) {
            return onAuth(req, res, success, method !== 'local');
        }


        res.status(status || 400).json({
            status: status || 400,
            error: err || info.message,
        });
    })(req, res, next);
}

/**
 * Handles successful authentication requests
 * @param  {Express Request} req
 * @param  {Express Reponse} res
 */
export function onAuth(req, res, data, redirect) {
    const token = jwt.sign({
        _id: data._id,
        session_token: data.session_token,
    }, req.app.get('config').api.signingKey, {expiresIn: '7d'});

    if (redirect) {
        return res.redirect(`${req.app.get('config').clientUrl}/auth?token=${token}`);
    }

    // send JWT back to client
    res.json({
        status: 200,
        authToken: token,
    });
}

/**
 * Loads the authentication strategies
 * @param  {Express} app
 */
export function getAuthList(req, res) {
    const providers = config.api.authentication.providers;
    const authlist = [];

    for (let provider in providers) {
        if (providers.hasOwnProperty(provider)) {
            if (!strategies[provider]) {
                continue;
            }

            if (!providers[provider].enabled) {
                continue;
            }

            authlist.push({
                provider,
                name: providers[provider].name,
                authUrl: `${config.api.domain}${[80, 443].includes(config.api.post) ? '' : `:${config.api.port}`}/api/auth/${provider}`
            });
        }
    };

    res.json({
        status: 200,
        authlist,
    });
}
