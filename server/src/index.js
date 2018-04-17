// Required for compiling

// native modules
import fs from 'fs';
import http from 'http';
import https from 'https';

// 3rd party
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import Promise from 'bluebird';

// Custom
import API from './api';
import Logger from './components/logger';
import {generate} from 'utils/configure';

// load .env file
const dotloaded = dotenv.config();

if (dotloaded.error) {
    throw new Error(dotloaded.result.error);
}

let config = generate();

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const Game = require('./game').Game;
const app = express();

// Connect to the MongoDB
Promise.promisifyAll(mongoose);
mongoose.connect(config.database.drivers.mongodb.host).then(
    () => {
        let webServer;
        let webServerApi;

        // if an SSL cert is defined, start a HTTPS server
        if (config.security.certificate.key) {
            webServer = https.createServer({
                key: fs.readFileSync(config.security.certificate.key, 'utf8'),
                cert: fs.readFileSync(config.security.certificate.cert, 'utf8'),
                ca: [
                    fs.readFileSync(config.security.certificate.ca, 'utf8'),
                ],
            }, app);
            webServerApi = https.createServer({
                key: fs.readFileSync(config.security.certificate.key, 'utf8'),
                cert: fs.readFileSync(config.security.certificate.cert, 'utf8'),
                ca: [
                    fs.readFileSync(config.security.certificate.ca, 'utf8'),
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
