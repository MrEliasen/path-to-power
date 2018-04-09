// Required for compiling
require('babel-core/register');
require('babel-polyfill');
require('dotenv').config();

// native modules
import fs from 'fs';
import http from 'http';
import https from 'https';

// 3rd party
import express from 'express';
import mongoose from 'mongoose';
import Promise from 'bluebird';

// Custom
import API from './api';
import Logger from './components/logger';
import configurator from '../utils/configurator';

/************************************
 *            FILE CHECK            *
 ************************************/
// Check if we have a data directory
if (!fs.existsSync(`${__dirname}/data`)) {
    console.error('ERROR: You you do have any src/data directory.');
    process.exit();
}

// check we have a config
if (!process.env.SIGNING_SECRET) {
    console.error('ERROR: You must specify your SIGNING_SECRET in the .env file.');
    process.exit();
}

let config = configurator();

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const Game = require('./game').Game;
const app = express();

// Connect to the MongoDB
Promise.promisifyAll(mongoose);
mongoose.connect(config.mongo_db).then(
    () => {
        let webServer;
        let webServerApi;

        // if an SSL cert is defined, start a HTTPS server
        if (config.server.certificate.key) {
            webServer = https.createServer({
                key: fs.readFileSync(config.server.certificate.key, 'utf8'),
                cert: fs.readFileSync(config.server.certificate.cert, 'utf8'),
                ca: [
                    fs.readFileSync(config.server.certificate.ca, 'utf8'),
                ],
            }, app);
            webServerApi = https.createServer({
                key: fs.readFileSync(config.server.certificate.key, 'utf8'),
                cert: fs.readFileSync(config.server.certificate.cert, 'utf8'),
                ca: [
                    fs.readFileSync(config.server.certificate.ca, 'utf8'),
                ],
            }, app);
        } else {
            // otherwise an HTTP server
            webServer = http.createServer(app);
            webServerApi = http.createServer(app);
        }

        const logger = new Logger({
            level: (process.env.NODE_ENV === 'development' ? 'info' : 'error'),
            debugFile: `${__dirname}/../logs/debug.log`,
            infoFile: `${__dirname}/../logs/info.log`,
            warnFile: `${__dirname}/../logs/warn.log`,
            errorFile: `${__dirname}/../logs/error.log`,
        });

        app.set('logger', logger);

        const GameServer = new Game(webServer, config, logger);
        // eslint-disable-next-line
        const RestServer = API(app, webServerApi, config);

        // On shutdown signal, gracefully shutdown the game server.
        process.on('SIGTERM', async function() {
            await GameServer.shutdown();
            process.exit();
        });
    },
    (err) => {
        return console.error(err);
    }
);