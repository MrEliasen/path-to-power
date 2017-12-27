/*
    This project is based on the original Streetwars Online 2 MUD, but B.Smith aka Wuzzbent.
    I would not have become a developer, if he had not open souced this game.

    Thanks you.
*/

// Load required packages
const express       = require('express');
const mongoose      = require('mongoose');
const bodyParser    = require('body-parser');
const https         = require('https');
const http          = require('http');
const fs            = require('fs');
const filter        = require('content-filter');
const helmet        = require('helmet');
const redis         = require('redis');
const winston       = require('winston');
const dump          = require('redis-dump-restore').dump;
  let webServer     = null;

try {
    var config = require('./config');
} catch(e) {
    return console.log("API not configured.");
}

/************************************
 *              LOGGER              *
 ************************************/
winston.level = process.env.LOG_LEVEL;
winston.add(winston.transports.File, {
    filename: 'error.log'
});
winston.remove(winston.transports.Console);

/************************************
 *          INITIALISATION          *
 ************************************/
// Create our Express application
var app = express();

// Connect to the MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongo_db, function(err) {
    if (err) {
        console.log(err);
        return;
    }
    
    console.log("DB connected");

    var redisClient = redis.createClient(config.redis_server);
    redisClient.on("error", function (err) {
        console.log("Redis error:",  + err);
    });

    // Setup bodyParser which we will need to parsing data submitted by the user
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // Add a bit of security for our app
    app.use(filter({
        methodList:['GET', 'POST', 'PATCH', 'DELETE']
    }));
    app.use(helmet());
    app.set('config', config);
    app.set('redis', redisClient);

    // Set needed headers for the application.
    app.use(function (req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type');

        // Whether requests needs to include cookies in the requests sent to the API. We shouldn't use this unless we retained sessions etc. which we don't!
        res.setHeader('Access-Control-Allow-Credentials', false);

        // Set the IP of the request, in case its from a proxy
        req.connection.remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Pass to next middleware
        next();
    });

    /************************************
     *         WEB SERVER SETUP         *
     ************************************/
    // if an SSL cert if defined, start the server with HTTPS
    if (config.ssl && config.ssl.cert !== "" && config.ssl.key !== "") {
        // load the SSL cert and create the webserver which handles the API
        webServer = https.createServer({
            key: fs.readFileSync(config.ssl.key, 'utf8'),
            cert: fs.readFileSync(config.ssl.cert, 'utf8'),
            ca: [
                (config.ssl.bundle ? fs.readFileSync(config.ssl.bundle, 'utf8') : '')
            ]
        }, app);
    } else {
        webServer = http.createServer(app)
    }

    /************************************
     *     LETSENCRYPT VERIFICATION     *
     ************************************/
    // bind information we need to the client
    app.use('/.well-known/acme-challenge', express.static('www/.well-known/acme-challenge'));

    // load the different versions of the API. Keep them separated for backwards compatibility. Once the API is live, you do NOT change that version.
    const game = require('./api/v1/route')(app, express, webServer);

    webServer.listen(config.app_port);
    console.log('Listning on port', config.app_port);

    // On shutdown signal, gracefully close all connections and clear the memory store.
    process.on('SIGTERM', function () {
        game.shutdown(function() {
            // error handling
            process.exit()
        })
    });
});