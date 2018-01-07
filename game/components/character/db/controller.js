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

exports.load = function(user_id, callback) {
    Character.findOne({ user_id: user_id }, function(err, character) {
        if (err) {
            return callback({
                type: 'error',
                message: 'Internal server error'
            });
        }

        return callback(null, character);
    });
}

exports.create = function(user_id, character_name, city, callback) {
    if (!city || city === '') {
        return callback({
            type: 'warning',
            message: 'You must choose a city.'
        });
    }

    // IDEA: create maps based on country, as players join. Have start in their own country!

    const newCharacter = new Character({
        user_id: user_id,
        name: character_name,
        location: {
            map: city
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