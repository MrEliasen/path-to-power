const Character = require('../models/character');
const winston   = require('winston');
const gameConfig    = require('../config.json');
const helper    = require('../helper');
const uuid      = require('uuid/v1');
const escapeStringRegex = require('escape-string-regexp');

// set from the init function
let redis;
let ioServer;
let gameMap;

function validateName(username) {
    let matches = escapeStringRegex(username).match(/[^0-91-z]+/i);
    return !matches;
}

exports.init = function(app, mapController, io) {
    redis = app.get('redis');
    gameMap = mapController;
    ioServer = io;
};

exports.loadFromDb = function(userId, callback) {
    const ecode = uuid();
    const fetchData = {
        userId: 1,
        name: 1,
        health: 1,
        health_max: 1,
        money: 1
    };

    Character.findOne({ userId: userId }, fetchData, function(err, character) {
        if (err) {
            winston.log('error', 'v1/controllers/character/load find character', {  
                err: err,
                id: ecode,
            });

            return callback({
                error_code: ecode,
                status_code: 500,
                message: 'Something went wrong while trying to create your character!'
            }, null);
        }

        set(userId, character, function() {
            return callback(null, character);
        });
    });
}

exports.create = function(userId, characterName, callback) {
    const ecode = uuid();

    // sanity check character name
    characterName = (characterName || '').toString().trim();

    if (!characterName || characterName === '') {
        return callback({
            status_code: 400,
            message: 'You cannot leave the character name blank.'
        });
    }

    // validate character name
    if (!validateName(characterName)) {
        return callback({
            status_code: 400,
            message: 'Your character name can only consist of alphanumeric character (0-9, a-z)'
        });
    }

    if (characterName.length < gameConfig.character.name_length_min || characterName.length > gameConfig.character.name_length_max) {
        return callback({
            status_code: 400,
            message: `Your character name must be between ${gameConfig.character.name_length_min} and ${gameConfig.character.name_length_max} characters long.`
        });
    }

    const newCharacter = new Character({
        userId: userId,
        name: characterName,
        health_max: gameConfig.character.defaults.health_max,
        health: gameConfig.character.defaults.health_max,
        money: gameConfig.character.defaults.money
    });

    newCharacter.save(function(err) {
        if (err) {
            if (err.code === 11000) {
                return callback({
                    status_code: 400,
                    message: `That character name is already taken.`
                });
            }

            winston.log('error', 'v1/controllers/character/load save character', {  
                err: err,
                id: ecode,
            });

            return callback({
                status_code: ecode,
                message: 'Something went wrong while trying to create your character!'
            });
        }

        set(userId, newCharacter, function() {
            callback(null, newCharacter);
        });
    });
}

function set(userId, playerObject, callback) {
    redis.set(`player_${userId}`, JSON.stringify(playerObject), function(err) {
        // Error with the redis store
        if (err) {
            return console.log('Redis Error', err);
        }

        updatePlayerSocket(userId);
        callback();
    })
}
exports.set = set;

function getCharacter(userId, callback) {
    redis.get(`player_${userId}`, function(err, playerData) {
        // Error with the redis store
        if (err) {
            return console.log('Redis Error', err);
        }

        playerData = helper.parseJson(playerData);

        if (!playerData) {
            playerData = {};
        }

        callback(playerData);
    });
}
exports.getCharacter = getCharacter;

function updatePlayerSocket(userId) {
    gameMap.getPlayerPosition(userId, function(position) {
        getCharacter(userId, function(playerObject) {
            ioServer.sockets.in(userId).emit('update character', {
                name: playerObject.name,
                mapTitle: position.title,
                money: playerObject.money,
                health: playerObject.health,
                health_max: playerObject.health_max,
            });
        })
    });
}
exports.updatePlayerSocket = updatePlayerSocket;