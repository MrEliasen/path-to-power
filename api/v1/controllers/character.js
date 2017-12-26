const Character = require('../models/character');
const winston   = require('winston');
const config    = require('../config.json');
const uuid      = require('uuid/v1');
const escapeStringRegex = require('escape-string-regexp');

function validateName(username) {
    let matches = escapeStringRegex(username).match(/[^0-91-z]+/i);
    return !matches;
}

exports.load = function(userId, callback) {
    const ecode = uuid();

    Character.findOne({ userId: userId }, { userId: 1, name: 1 }, function(err, character) {
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

        return callback(null, character);
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

    if (characterName.length < config.character.name_length_min || characterName.length > config.character.name_length_max) {
        return callback({
            status_code: 400,
            message: `Your character name must be between ${config.character.name_length_min} and ${config.character.name_length_max} characters long.`
        });
    }

    const newCharacter = new Character({
        userId: userId,
        name: characterName
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

            return callback(ecode);
        }

        callback(null, newCharacter);
    });
}

exports.updateCharacter = function(userId, schemaKey, value) {

}