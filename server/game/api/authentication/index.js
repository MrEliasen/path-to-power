import passport from 'passport';
import config from '../../../config.json';
import UserModel from '../models/user';
import IdentityModel from '../models/identity';
import jwt from 'jsonwebtoken';

// authentication strategies
import * as localAuth from './strategies/local';
import oauthSetup from './strategies/oauth';

/**
 * Loads the authentication strategies
 * @param  {Express} app
 */
export function loadStrategies(passport, logger) {
    const providers = config.api.authentication.providers;

    for (let provider in providers) {
        if (providers.hasOwnProperty(provider)) {
            if (!providers[provider].enabled) {
                continue;
            }

            let callbackUrl = `${config.api.domain}${[80, 443].includes(config.api.post) ? '' : `:${config.api.port}`}/api/auth/provider/${providers[provider].id}/callback`;

            // if its the local auth provider, we have to use a separate strategy from OAuth.
            if (provider === 'local') {
                localAuth.setup(passport, logger);
                continue;
            }

            try {
                oauthSetup(
                    passport,
                    {
                        ...providers[provider],
                        callbackUrl,
                    },
                    logger
                );
            } catch (err) {
                logger.error(err);
            }
        }
    };
}

/**
 * Handle local auth password reset requests
 */
export const resetPassword = localAuth.passwordReset;

/**
 * Handle local auth password reset confirmation links
 */
export const resetConfirm = localAuth.resetConfirm;


/**
 * Handles user activation requests
 * @param  {Express Request}  req
 * @param  {Express Response} res
 */
export function activateUser(req, res) {
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

    UserModel.findOne({_id: escape(req.params.userId), activationToken: escape(req.query.token)}, (err, user) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        if (!user) {
            return res.status(400).json({
                status: 400,
                error: 'Invalid activation token.',
            });
        }

        // activate the user and remove the token
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
 * Creates a new user for the identity, and link it to the identity
 * @param  {Express Request} req
 * @param  {Express Response} res
 * @param  {Identity} identity
 */
function linkNewUser(req, res, identity) {
    const newUser = new UserModel({
        activated: true,
    });

    newUser.save((err) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                message: 'Something went wrong. Please try again in a moment.',
            });
        }

        identity.userId = newUser._id.toString();

        identity.save((err) => {
            if (err) {
                return res.status(500).json({
                    status: 500,
                    message: 'Something went wrong. Please try again in a moment.',
                });
            }

            onAuth(req, res, {
                user: newUser.toObject(),
                identity,
            }, false);
        });
    });
}

/**
 * Authenticates a OAuth provider token, logging in to the attached account
 * Or creates a new account is none is linked.
 * @param  {Express Request} req
 * @param  {Express Request} res
 */
function authenticateProvider(req, res) {
    const providerToken = req.body.providerToken;

    jwt.verify(providerToken, req.app.get('config').api.signingKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: 401,
                message: 'Invalid authorisation token.',
            });
        }

        IdentityModel.findOne({_id: decoded.identity}, (err, identity) => {
            if (err) {
                return res.status(500).json({
                    status: 500,
                    message: 'Something went wrong. Please try again in a moment.',
                });
            }

            if (!identity) {
                return res.status(401).json({
                    status: 401,
                    message: 'Invalid authorisation token.',
                });
            }

            // if the identity is not linked to an account, create one.
            if (!identity.userId) {
                return linkNewUser(req, res, identity);
            }

            // convert mongoose object to plain object.
            identity = identity.toObject();

            // fetch the user details, and send back a user-jwt token
            UserModel.findOne({_id: identity.userId}, (err, user) => {
                if (err) {
                    return res.status(500).json({
                        status: 500,
                        message: 'Something went wrong. Please try again in a moment.',
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        status: 401,
                        message: 'Invalid authorisation token.',
                    });
                }

                onAuth(req, res, {
                    user: user.toObject(),
                    identity,
                }, false);
            });
        });
    });
}

/**
 * Handles authentication requests
 * @param  {Express Request} req
 * @param  {Express Response} res
 * @return {Function}
 */
export function authenticate(req, res, next) {
    // check if we are authenticating a provider token
    if (req.body.providerToken) {
        return authenticateProvider(req, res);
    }

    // continue with account authentication
    let method = req.body.method || req.params.provider;
    method = method.toString().toLowerCase();

    if (!method) {
        return res.status(400).json({
            status: 400,
            error: 'Invalid authentication method.',
        });
    }

    if (!Object.keys(req.app.get('config').api.authentication.providers).includes(method)) {
        return res.status(400).json({
            status: 400,
            error: 'Invalid authentication method.',
        });
    }

    return passport.authenticate(method, {session: false}, (err, userDetails, info, status) => {
        if (err) {
            return res.status(400).json({
                status: 400,
                error: 'Invalid authentication method.',
            });
        }

        if (userDetails) {
            return onAuth(req, res, userDetails, method !== 'local');
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
        _id: data.user._id || null,
        session_token: data.user.session_token || null,
        identity: data.identity._id || null,
    }, req.app.get('config').api.signingKey, {expiresIn: '1h'});

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
            if (!providers[provider].enabled) {
                continue;
            }

            authlist.push({
                provider,
                name: providers[provider].name,
                authUrl: `${config.api.domain}${[80, 443].includes(config.api.post) ? '' : `:${config.api.port}`}/api/auth/provider/${providers[provider].id}`,
            });
        }
    };

    res.json({
        status: 200,
        authlist,
    });
}

/**
 * Verifies a request has a legit auth token
 * @param  {Express Request}   req
 * @param  {Express Response}  res
 * @param  {Function}          next
 */
export function isAuthenticated(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({
            status: 401,
            message: 'Invalid authorisation token.',
        });
    }

    jwt.verify(token.replace('Bearer ', ''), req.app.get('config').api.signingKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: 401,
                message: 'Invalid authorisation token.',
            });
        }

        // check the token is for the user we are altering.
        if (!req.params.userId || req.params.userId !== decoded._id) {
            return res.status(401).json({
                status: 401,
                message: 'Invalid authorisation token.',
            });
        }

        UserModel.findOne(
            {_id: decoded._id, session_token: decoded.session_token},
            {_id: 1, email: 1, session_token: 1, activated: 1, date_added: 1, password: 1},
            (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        status: 401,
                        message: 'Invalid authorisation token.',
                    });
                }

                const userDetails = user.toObject();

                // check if the user has set a password (have local auth enabled)
                userDetails.password = userDetails.password ? true : false;

                req.user = userDetails;
                next();
            }
        );
    });
}

/**
 * Links a provider to an account
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function linkProvider(req, res) {
    if (!req.body.provider || !req.body.authToken) {
        return res.status(400).json({
            status: 400,
            error: 'Invalid provider token',
        });
    }

    jwt.verify(req.body.authToken, req.app.get('config').api.signingKey, (err, authTokenDecoded) => {
        if (err) {
            return res.status(400).json({
                status: 400,
                error: 'Invalid provider token',
            });
        }

        jwt.verify(req.body.provider, req.app.get('config').api.signingKey, (err, decoded) => {
            if (err) {
                return res.status(400).json({
                    status: 400,
                    error: 'Invalid provider token',
                });
            }

            IdentityModel.findOne({_id: decoded.identity}, (err, identity) => {
                if (err) {
                    return res.status(500).json({
                        status: 500,
                        error: 'Something went wrong. Please try again in a moment.',
                    });
                }

                if (!identity) {
                    return res.status(400).json({
                        status: 400,
                        error: 'Invalid provider token',
                    });
                }

                identity.userId = authTokenDecoded._id;

                identity.save((err) => {
                    if (err) {
                        return res.status(500).json({
                            status: 500,
                            error: 'Something went wrong. Please try again in a moment.',
                        });
                    }

                    return res.json({
                        status: 200,
                        message: 'Your account was linked!',
                    });
                });
            });
        });
    });
}
