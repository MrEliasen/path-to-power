// native modules
import child_process from 'child_process';
import fs from 'fs';
import http from 'http';

//3rd party
import express from 'express';
import mongoose from 'mongoose';
import Game from './game';

/************************************
 *            FILE CHECK            *
 ************************************/
let config = require('./config');

// if this is the first time they run the server, copy the default files.
if (!fs.existsSync('./game/data')) {
    //rename the data.new directory
    child_process.execSync('cp -R ./game/data.new ./game/data');
}

// check we have a config. If not, generate one
if (!config) {
    fs.copyFileSync('./config.new.json', './config.json');
    config = require('./config');
}

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express server
const app = express();

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db, { useMongoClient: true }).then(
    () => {
        const webServer = http.createServer(app)
        const GameServer = new Game(webServer, config);

        // On shutdown signal, gracefully close all connections and clear the memory store.
        process.on('SIGTERM', function () {
            // To be added later!
            // GameServer.shutdown(() => {
            //     process.exit();
            // });
        });
    },
    (err) => {
        throw err;
    }
);