// Required for compiling
require('babel-core/register');
require('babel-polyfill');

// native modules
import fs from 'fs';
import http from 'http';
import https from 'https';

// 3rd party
import express from 'express';
import mongoose from 'mongoose';

/************************************
 *            FILE CHECK            *
 ************************************/
// Check if we have a data directory
if (!fs.existsSync(`${__dirname}/data`)) {
    console.error('ERROR: You you do have any game/data directory.');
    process.exit();
}

// check we have a config
if (!fs.existsSync(`${__dirname}/../config.json`)) {
    console.error('ERROR: You do not have a config.json file.');
    process.exit();
}

let config = require(`${__dirname}/../config.json`);
if (!config.twitch.clientId || config.twitch.clientId === '') {
    console.error('ERROR: You must provide a Twitch Application ID for the server to work.');
    process.exit();
}

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const Game = require('./game').Game;
const app = express();

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db).then(
    () => {
        let webServer;

        // if an SSL cert is defined, start a HTTPS server
        if (config.server.certificate.key) {
            webServer = https.createServer({
                key: fs.readFileSync(config.server.certificate.key, 'utf8'),
                cert: fs.readFileSync(config.server.certificate.cert, 'utf8'),
                ca: [
                    fs.readFileSync(config.server.certificate.ca, 'utf8'),
                ],
            }, app);
        } else {
            // otherwise an HTTP server
            webServer = http.createServer(app);
        }

        const GameServer = new Game(webServer, config);

        // On shutdown signal, gracefully shutdown the game server.
        process.on('SIGTERM', function() {
            GameServer.shutdown(() => {
                process.exit();
            });
        });
    },
    (err) => {
        return console.error(err);
    }
);
