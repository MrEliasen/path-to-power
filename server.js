// Load required packages
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import https from 'https';
import http from 'http';
import fs from 'fs';
import filter from 'content-filter';
import helmet from 'helmet';
import redis from 'redis';
import Game from './game';

const config = require('./config');

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express application
const app = express();
let GameServer;

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db, { useMongoClient: true });

const redisClient = redis.createClient(config.redis_server);
redisClient.on("error", function (err) {
    console.log("Redis error:",  + err);
});

const webServer = http.createServer(app)

// load the different versions of the API. Keep them separated for backwards compatibility. Once the API is live, you do NOT change that version.
GameServer = new Game(webServer, config);

// On shutdown signal, gracefully close all connections and clear the memory store.
/*process.on('SIGTERM', function () {
    GameServer.shutdown(function() {
        // error handling
        process.exit()
    })
});*/