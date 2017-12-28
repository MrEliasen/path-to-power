const Character = require('./model');
const config = require('../../../../config.json');
const escapeStringRegex = require('escape-string-regexp');

function validateName(username) {
    let matches = escapeStringRegex(username).match(/[^0-9a-z]+/i);
    return !matches;
}

exports.loadFromDb = function(user_id, callback) {
    const fetchData = {
        user_id: 1,
        name: 1,
        stats: 1,
        location: 1,
        inventory: 1
    };

    Character.findOne({ user_id: user_id }, fetchData, function(err, character) {
        if (err) {
            return callback({
                status_code: 500,
                message: 'Something went wrong while trying to create your character!'
            });
        }

        return callback(null, character);
    });
}

exports.createNew = function(user_id, character_name, callback) {
    // sanity check character name
    character_name = (character_name || '').toString().trim();

    if (!character_name || character_name === '') {
        return callback({
            status_code: 400,
            message: 'You cannot leave the character name blank.'
        });
    }

    // validate character name
    if (!validateName(character_name)) {
        return callback({
            status_code: 400,
            message: 'Your character name can only consist of alphanumeric character (0-9, a-z)'
        });
    }

    if (character_name.length < config.game.character.name_length_min || character_name.length > config.game.character.name_length_max) {
        return callback({
            status_code: 400,
            message: `Your character name must be between ${config.game.character.name_length_min} and ${config.game.character.name_length_max} characters long.`
        });
    }

    const newCharacter = new Character({
        user_id: user_id,
        name: character_name,
        stats: {
            health_max: config.game.character.defaults.health_max,
            health: config.game.character.defaults.health_max,
            money: config.game.character.defaults.money
        },
        inventory: {},
        location: {}
    });

    newCharacter.save(function(err) {
        if (err) {
            if (err.code === 11000) {
                return callback({
                    status_code: 400,
                    message: `That character name is already taken.`
                });
            }

            return callback({
                message: 'Something went wrong while trying to create your character!'
            });
        }

        callback(null, newCharacter);
    });
}