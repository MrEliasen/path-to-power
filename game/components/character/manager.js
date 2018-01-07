// Manager specific imports
import Character from './object';
import CharacterModel from './model';

export default class CharacterManager {
    constructor(Game) {
        this.Game = Game;
        // keeps track of all current in-game characters
        this.characters = {};

        // log manager progress
        this.Game.logger.debug('CharacterManager::constructor Loaded');
    }

    /**
     * loads a character from the mongodb, based on user_id
     * @param  {String}   user_id  The user ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details.
     */
    load(user_id, callback) {
        this.dbLoad(user_id, (error, character) => {
            if (error) {
                return callback(error);
            }

            if (!character) {
                return callback(null, null);
            }

            this.characters[user_id] = new Character(character.toObject());
            callback(null, this.characters[user_id]);
        })
    }

    /**
     * database method, attempts to load a character from the database
     * @param  {String}   user_id  User ID who owns the character
     * @param  {Function} callback returns error and character object
     */
    dbLoad(user_id, callback) {
        CharacterModel.findOne({ user_id: user_id }, function(err, character) {
            if (err) {
                this.Game.logger.error('CharacterManager::dbLoad', err);
                return callback({
                    type: 'error',
                    message: 'Internal server error.'
                });
            }

            return callback(null, character);
        });
    }

    /**
     * create a new character
     * @param  {String}   user_id  User ID of the account
     * @param  {String}   name     Character Name
     * @param  {String}   city     Starting city ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details
     */
    create(user_id, name, city, callback) {
        this.dbCreate(user_id, name, city, (error, character) => {
            if (error) {
                return callback(error)
            }

            // convery mongodb obj to plain obj before returning it
            return callback(null, character.toObject());
        })
    }

    /**
     * Database method, will attempts to create a new character
     * @param  {String}   user_id        User Id of account
     * @param  {String}   character_name Twitch Name
     * @param  {String}   city           ID of city to start in
     * @param  {Function} callback       Returns an error and character object
     */
    dbCreate(user_id, character_name, city, callback) {
        if (!city || city === '') {
            return callback({
                type: 'warning',
                message: 'You must choose a city.'
            });
        }

        // IDEA: create maps based on country, as players join. Have start in their own country!

        const newCharacter = new CharacterModel({
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

                this.Game.logger.error('CharacterManager::dbCreate', err);
                return callback({
                    type: 'error',
                    message: 'Internal server error.'
                });
            }

            callback(null, newCharacter);
        });
    }

    dbSave(character, callback) {
        CharacterModel.findOnethis.Game.logger.error('CharacterManager::dbSave', err);({ user_id: character.user_id }, (err, dbCharacter) => {
            if (err) {
                this.Game.logger.error('CharacterManager::dbSave', err);
                return callback();
            }

            // NOTE: add any information you want to save here.
            dbCharacter.stats = data.stats;
            dbCharacter.location = data.location;
            dbCharacter.inventory = data.inventory;
            dbCharacter.equipped = data.equipped;
            dbCharacter.save((err) => {
                if (err) {
                    console.log(err);
                }

                callback();
            });
        });
    }
}