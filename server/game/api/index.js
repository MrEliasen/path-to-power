// Required for compiling
require('babel-core/register');
require('babel-polyfill');

import helmet from 'helmet';
import bodyParser from 'body-parser';
import contentFilter from 'content-filter';
import passport from 'passport';
import express from 'express';
import nodemailer from 'nodemailer';

// API Route/enpoint controllers
import {
    loadStrategies,
    authenticate,
    getAuthList,
    activateUser,
    isAuthenticated,
    resetPassword,
    resetConfirm,
    linkProvider,
    unlinkProvider,
} from './authentication';

import {
    createUser,
    updateUser,
    deleteUser,
    getUser,
    verifyEmail,
} from './user';

/**
 * Setup the API endpoints
 * @param  {HTTP/S}  webserver The HTTP/s webserver
 * @param  {Express} app       Express app
 */
export default function(app, config) {
    app.set('config', config);
    app.use(bodyParser.json());
    app.use(helmet());
    app.use(passport.initialize());
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(contentFilter({
        methodList: ['GET', 'POST'],
    }));

    // setup mailer service
    let mailerTransport;

    switch (config.mailserver.transport) {
        case 'sendgrid':
            const sgTransport = require('nodemailer-sendgrid-transport');

            mailerTransport = sgTransport({
                service: 'SendGrid',
                auth: {
                    api_user: process.env.MAILER_USER,
                    api_key: process.env.MAILER_PASSWORD,
                }
            });
            break;

        default:
            mailerTransport = {
                host: config.mailserver.host,
                port: config.mailserver.port,
                auth: {
                    user: process.env.MAILER_USER,
                    pass: process.env.MAILER_PASSWORD,
                },
            };
            break;
    }

    app.set('mailer', nodemailer.createTransport(mailerTransport));

    // Set needed headers for the application.
    app.use(function(req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Accept, X-Requested-With, Content-Type');
        // Whether requests needs to include cookies in the requests sent to the API. We shouldn't use this unless we retained sessions etc. which we don't!
        res.setHeader('Access-Control-Allow-Credentials', false);
        // Pass to next middleware
        next();
    });

    // load all authentication strategies
    loadStrategies(passport, app.get('logger'));

    // setup API routes
    // eslint-disable-next-line
    const routes = express.Router({
        caseSensitive: false,
    });

    // Account Routes
    routes.route('/users')
        .post(createUser);
    routes.route('/users/:userId')
        .get(isAuthenticated, getUser)
        .delete(isAuthenticated, deleteUser)
        .patch(isAuthenticated, updateUser);
    routes.route('/users/:userId/activate')
        .get(activateUser);
    routes.route('/users/:userId/verify')
        .get(verifyEmail);

    // Authentication Routes
    // user/password authentication
    routes.route('/auth')
        .get(getAuthList)
        .post(authenticate);

    // password reset requests
    routes.route('/auth/reset')
        .post(resetPassword);
    routes.route('/auth/reset/:userId')
        .get(resetConfirm);
    // Linking and unlinking of providers
    routes.route('/auth/link')
        .post(linkProvider);
    routes.route('/auth/unlink')
        .post(isAuthenticated, unlinkProvider);

    // OAuth
    routes.route('/auth/provider/:provider')
        .get(authenticate);
    routes.route('/auth/provider/:provider/callback')
        .get(authenticate);

    // register the routes to the /api prefix
    app.use('/api', routes);

    // listen on port 80
    app.listen(config.api.port);
    console.log(`API listening on port ${config.api.port}`);
};
