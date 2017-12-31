import Character from './model';
import escapeStringRegex from 'escape-string-regexp';
import config from '../../../../config.json';

function validateName(username) {
    let matches = escapeStringRegex(username).match(/[^0-9a-z]+/i);
    return !matches;
}

exports.getCharacterByName = function(name, callback) {
    const fetchData = {
        user_id: 1,
        name: 1
    };

    Character.findOne({ name_lowercase: name.toLowerCase() }, fetchData, function(err, character) {
        if (err) {
            return callback({
                type: CLIENT_NOTIFICATION,
                subtype: SERVER_TO_CLIENT,
                payload: {
                    type: 'error',
                    message: 'Internal server error'
                }
            });
        }

        return callback(null, character.toObject());
    });
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
                type: CLIENT_NOTIFICATION,
                subtype: SERVER_TO_CLIENT,
                payload: {
                    type: 'error',
                    message: 'Internal server error'
                }
            });
        }

        return callback(null, character.toObject());
    });
}

exports.create = function(user_id, action, callback) {
    // sanity check character name
    const character_name = action.payload.name.toString().trim();

    if (!character_name || character_name === '') {
        return callback({
            type: 'warning',
            message: 'You cannot leave the character name blank.'
        });
    }

    // validate character name
    if (!validateName(character_name)) {
        return callback({
            type: 'warning',
            message: 'Your character name can only consist of alphanumeric character (0-9, a-z)'
        });
    }

    if (character_name.length < config.game.character.name_length_min || character_name.length > config.game.character.name_length_max) {
        return callback({
            type: 'warning',
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
                    type: 'warning',
                    message: `That character name is already taken.`
                });
            }

            return callback({
                type: 'error',
                message: 'Internal server error'
            });
        }

        callback(null, newCharacter.toObject());
    });
}