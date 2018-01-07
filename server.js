/*
    This project is based on the original Streetwars Online 2 MUD, but B.Smith aka Wuzzbent.
    I would not have become a developer, if he had not open souced this game.

    Thanks you.
*/

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

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db, async function(err) {
    if (err) {
        console.log(err);
        return;
    }
    
    console.log("DB connected");

    const redisClient = redis.createClient(config.redis_server);
    redisClient.on("error", function (err) {
        console.log("Redis error:",  + err);
    });

    const webServer = http.createServer(app)

    // load the different versions of the API. Keep them separated for backwards compatibility. Once the API is live, you do NOT change that version.
    const GameServer = new Game(webServer, config);

    // On shutdown signal, gracefully close all connections and clear the memory store.
    /*process.on('SIGTERM', function () {
        GameServer.shutdown(function() {
            // error handling
            process.exit()
        })
    });*/
});