import passport from 'passport';
import UserModel from '../models/user';
import IdentityModel from '../models/identity';
import jwt from 'jsonwebtoken';

// authentication strategies
import * as localAuth from './strategies/local';
import oauthSetup from './strategies/oauth';

/**
 * Outputs API response or redirects the response to the client
 * @param  {Express Request}  req
 * @param  {Express Response} res
 * @param  {String|Object}    output
 */
function output(req, res, output) {
    const redirect = req.params.provider ? true : false;
    const errorUrl = `${req.app.get('config').app.clientUrl}/auth?error=`;

    if (redirect) {
        return res.redirect(`${errorUrl}${output.error || output.message}`);
    }

    res.status(output.status || 200).json(output);
}

/**
 * Loads the authentication strategies
 * @param  {Express} app
 */
export function loadStrategies(passport, logger, config) {
    config.auth.providers.forEach((provider) => {
        let callbackUrl = `${config.api.url}${[80, 443].includes(config.api.port) ? '' : `:${config.api.port}`}/api/auth/provider/${provider.id}/callback`;

        if (provider.enabled) {
            // if its the local auth provider, we have to use a separate strategy from OAuth.
            if (provider.id === 'local') {
                return localAuth.setup(passport, logger);
            }

            try {
                oauthSetup(
                    passport,
                    {
                        ...provider,
                        callbackUrl,
                    },
                    logger
                );
            } catch (err) {
                logger.error(err);
            }
        }
    });
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
        return output(req, res, {
            status: 400,
            error: 'Missing activation token.',
        });
    }

    if (req.query.token.length !== 64) {
        return output(req, res, {
            status: 400,
            error: 'Invalid activation token.',
        });
    }

    UserModel.findOne({_id: escape(req.params.userId), activationToken: escape(req.query.token)}, (err, user) => {
        if (err) {
            return output(req, res, {
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        if (!user) {
            return output(req, res, {
                status: 400,
                error: 'Invalid activation token.',
            });
        }

        // activate the user and remove the token
        user.activationToken = '';
        user.activated = true;

        user.save((err) => {
            if (err) {
                return output(req, res, {
                    status: 500,
                    error: 'Sometihng went wrong. Please try again in a moment.',
                });
            }

            return output(req, res, {
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
            return output(req, res, {
                status: 500,
                message: 'Something went wrong. Please try again in a moment.',
            });
        }

        identity.userId = newUser._id.toString();

        identity.save((err) => {
            if (err) {
                return output(req, res, {
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

    jwt.verify(providerToken, req.app.get('config').security.signingSecret, (err, decoded) => {
        if (err) {
            return output(req, res, {
                status: 401,
                message: 'Invalid authorisation token.',
            });
        }

        IdentityModel.findOne({_id: decoded.identity}, (err, identity) => {
            if (err) {
                return output(req, res, {
                    status: 500,
                    message: 'Something went wrong. Please try again in a moment.',
                });
            }

            if (!identity) {
                return output(req, res, {
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
                    return output(req, res, {
                        status: 500,
                        message: 'Something went wrong. Please try again in a moment.',
                    });
                }

                if (!user) {
                    return output(req, res, {
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
    let method = (req.body.method || req.params.provider) + ''.toLowerCase();

    if (!method) {
        return output(req, res, {
            status: 400,
            error: 'Invalid authentication method.',
        });
    }

    const provider = req.app.get('config').auth.providers.find((obj) => obj.id === method);

    if (!provider) {
        return output(req, res, {
            status: 400,
            error: 'Invalid authentication method.',
        });
    }

    return passport.authenticate(provider.id, Object.assign({session: false}, {scope: provider.scope || null}), (err, userDetails, info, status) => {
        if (err) {
            req.app.get('logger').error(err);

            return output(req, res, {
                status: 400,
                error: 'Invalid authentication method.',
            });
        }

        if (userDetails) {
            return onAuth(req, res, userDetails, method !== 'local');
        }

        return output(req, res, {
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
    }, req.app.get('config').security.signingSecret, {expiresIn: '1h'});

    if (redirect) {
        return res.redirect(`${req.app.get('config').app.clientUrl}/auth?token=${token}`);
    }

    // send JWT back to client
    output(req, res, {
        status: 200,
        authToken: token,
    });
}

/**
 * Loads the authentication strategies
 * @param  {Express} app
 */
export function getAuthList(req, res) {
    const config = req.app.get('config');
    const providers = config.auth.providers.filter((provider) => provider.enabled);
    const authlist = providers.map((provider) => {
        return {
            id: provider.id,
            name: provider.name,
            authUrl: `${config.api.url}${[80, 443].includes(config.api.port) ? '' : `:${config.api.port}`}/api/auth/provider/${provider.id}`,
        };
    });

    output(req, res, {
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
        return output(req, res, {
            status: 401,
            message: 'Invalid authorisation token.',
        });
    }

    jwt.verify(token.replace('Bearer ', ''), req.app.get('config').security.signingSecret, (err, decoded) => {
        if (err) {
            return output(req, res, {
                status: 401,
                message: 'Invalid authorisation token.',
            });
        }

        // check the token is for the user we are altering, if it is set
        // This could be removed, and simply rely on the auth token.
        if (req.params.userId) {
            if (req.params.userId !== decoded._id) {
                return output(req, res, {
                    status: 401,
                    message: 'Invalid authorisation token.',
                });
            }
        }

        UserModel.findOne(
            {_id: decoded._id, session_token: decoded.session_token},
            {_id: 1, email: 1, session_token: 1, activated: 1, date_added: 1, password: 1},
            (err, user) => {
                if (err || !user) {
                    return output(req, res, {
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
        return output(req, res, {
            status: 400,
            error: 'Invalid provider token',
        });
    }

    jwt.verify(req.body.authToken, req.app.get('config').security.signingSecret, (err, authTokenDecoded) => {
        if (err) {
            return output(req, res, {
                status: 400,
                error: 'Invalid provider token',
            });
        }

        jwt.verify(req.body.provider, req.app.get('config').security.signingSecret, (err, decoded) => {
            if (err) {
                return output(req, res, {
                    status: 400,
                    error: 'Invalid provider token',
                });
            }

            IdentityModel.findOne({_id: decoded.identity}, (err, identity) => {
                if (err) {
                    return output(req, res, {
                        status: 500,
                        error: 'Something went wrong. Please try again in a moment.',
                    });
                }

                if (!identity) {
                    return output(req, res, {
                        status: 400,
                        error: 'Invalid provider token',
                    });
                }

                identity.userId = authTokenDecoded._id;

                identity.save((err) => {
                    if (err) {
                        return output(req, res, {
                            status: 500,
                            error: 'Something went wrong. Please try again in a moment.',
                        });
                    }

                    return output(req, res, {
                        status: 200,
                        message: 'Your account was linked!',
                    });
                });
            });
        });
    });
}

/**
 * Unlinks a provider from an account
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
export function unlinkProvider(req, res) {
    if (!req.body.provider) {
        return output(req, res, {
            status: 400,
            error: 'Invalid provider',
        });
    }

    IdentityModel.findOne({provider: req.body.provider, userId: req.user._id}, (err, identity) => {
        if (err) {
            return output(req, res, {
                status: 500,
                error: 'Something went wrong. Please try again in a moment.',
            });
        }

        if (!identity) {
            return output(req, res, {
                status: 400,
                error: 'Provider is not linked to your account.',
            });
        }

        identity.remove((err) => {
            if (err) {
                return output(req, res, {
                    status: 500,
                    error: 'Something went wrong. Please try again in a moment.',
                });
            }

            return output(req, res, {
                status: 200,
                message: '',
            });
        });
    });
}
