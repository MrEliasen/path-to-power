import express from 'express';
import passport from 'passport';
import {init as localAuth} from './strategies/local';

/**
 * Handle local authentication requests
 * @param  {Function} done
 */
export function setup(app) {
    // Create the API routes/endpoint
    // eslint-disable-next-line
    const routes = express.Router({
        caseSensitive: false,
    });

    // setup passport
    app.use(passport.initialize());

    // Setup the stategies
    localAuth(passport, routes);

    // register the routes to the /api prefix
    app.use('/api', routes);
}
