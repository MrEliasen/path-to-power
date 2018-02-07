// Required for compiling
require("babel-core/register");
require("babel-polyfill");

// native modules
import fs from 'fs';
import http from 'http';
import readline from 'readline-sync';
import child_process from 'child_process';

// 3rd party
import express from 'express';
import mongoose from 'mongoose';

/************************************
 *            FILE CHECK            *
 ************************************/
// if this is the first time they run the server, copy the default files.
if (!fs.existsSync(`${__dirname}/data`)) {
    //rename the data.new directory
    child_process.execSync(`cp -R ${__dirname}/data.new ${__dirname}/data`);
}

let config;
// check we have a config. If not, generate one
if (!fs.existsSync(`${__dirname}/../config.json`)) {
    config = require(`${__dirname}/../config.new.json`);

    // get the twitch client id
    config.twitch.clientId = readline.question('First time setup. Enter your Twitch.tv Application Client ID (this can always be changed in the config.json later): ');
    // make sure a value was supplied
    if (!config.twitch.clientId || config.twitch.clientId === '') {
        console.error('ERROR: You must provide a Twitch Application ID for the server to work.');
        process.exit();
    }

    // create a new config.json file
    fs.writeFileSync(`${__dirname}/../config.json`, JSON.stringify(config, null, 4), 'utf8');
} else {
    config = require(`${__dirname}/../config.json`);
}

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const app = express();
const Game = require('./game').Game;

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db).then(
    () => {
        const webServer = http.createServer(app);
        const GameServer = new Game(webServer, config);

        // On shutdown signal, gracefully close all connections and clear the memory store.
        process.on('SIGTERM', function() {
            // To be added later!
            // GameServer.shutdown(() => {
            //     process.exit();
            // });
        });
    },
    (err) => {
        return console.error(err);
    }
);
