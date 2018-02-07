// native modules
import child_process from 'child_process';
import fs from 'fs';
import http from 'http';
import readline from 'readline-sync';

// 3rd party
import express from 'express';
import mongoose from 'mongoose';

/************************************
 *            FILE CHECK            *
 ************************************/
// if this is the first time they run the server, copy the default files.
if (!fs.existsSync('./game/data')) {
    //rename the data.new directory
    child_process.execSync('cp -R ./game/data.new ./game/data');
}

let config;
// check we have a config. If not, generate one
if (!fs.existsSync('./config.json')) {
    config = require('./config.new.json');

    // get the twitch client id
    config.twitch.clientId = readline.question('First time setup. Enter your Twitch.tv Application Client ID (this can always be changed in the config.json later): ');
    // make sure a value was supplied
    if (!config.twitch.clientId || config.twitch.clientId === '') {
        console.error('ERROR: You must provide a Twitch Application ID for the server to work.');
        process.exit();
    }

    // create a new config.json file
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4), 'utf8');
} else {
    config = require('./config.json');
}

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const app = express();

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db, {useMongoClient: true}).then(
    () => {
        const webServer = http.createServer(app);
        const GameServer = require('./game')(webServer, config);

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
