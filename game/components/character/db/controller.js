import Character from './model';
import escapeStringRegex from 'escape-string-regexp';
import config from '../../../../config.json';

function validateName(username) {
    let matches = escapeStringRegex(username).match(/[^0-9a-z]+/i);
    return !matches;
}

exports.autoSave = function(characterObj, callback) {
    callback = callback || function() {};

    saveCharacter(characterObj, () => {
        callback();
    })
}

export function saveCharacter(data, callback) {
    callback = callback || function() {};

    Character.findOne({ user_id: data.user_id }, (err, character) => {
        if (err) {
            console.log(err);
            return callback();
        }

        // NOTE: add any information you want to save here.
        character.stats = data.stats;
        character.location = data.location;
        character.inventory = data.inventory;
        character.equipped = data.equipped;
        character.save((err) => {
            if (err) {
                console.log(err);
            }

            callback();
        });
    });
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

        return callback(null, character);
    });
}

exports.loadFromDb = function(user_id, callback) {
    const fetchData = {
        user_id: 1,
        name: 1,
        stats: 1,
        location: 1,
        inventory: 1,
        equipped: 1
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

        return callback(null, character);
    });
}

exports.create = function(user_id, action, cities, callback) {
    // sanity check character name
    const character_name = action.payload.name.toString().trim();
    const city = action.payload.city.toString().trim();

    if (!character_name || character_name === '') {
        return callback({
            type: 'warning',
            message: 'You cannot leave the character name blank.'
        });
    }

    if (!city || city === '') {
        return callback({
            type: 'warning',
            message: 'You must choose a city.'
        });
    }

    // validate character name
    if (!validateName(character_name)) {
        return callback({
            type: 'warning',
            message: 'Your character name can only consist of alphanumeric character (0-9, a-z)'
        });
    }

    // validate character name
    if (!cities[city]) {
        return callback({
            type: 'warning',
            message: 'Please choose a city from the list.'
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
            money: config.game.character.defaults.money,
            bank: config.game.character.defaults.bank
        },
        inventory: [],
        location: {
            map: city,
            ...cities[city].spawn
        }
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

        callback(null, newCharacter);
    });
}