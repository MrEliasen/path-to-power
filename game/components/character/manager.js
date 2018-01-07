import { load, create } from './db/controller';
import Character from './object';

export default class CharacterManager {
    constructor(Game) {
        this.Game = Game;
        console.log('CharacterManager')
        // keeps track of all current in-game characters
        this.characters = {};
    }

    /**
     * loads a character from the mongodb, based on user_id
     * @param  {String}   user_id  The user ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details.
     */
    load(user_id, callback) {
        load(user_id, (error, character) => {
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
     * create a new character
     * @param  {String}   user_id  User ID of the account
     * @param  {String}   name     Character Name
     * @param  {String}   city     Starting city ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details
     */
    create(user_id, name, city, callback) {
        create(user_id, name, city, (error, character) => {
            if (error) {
                return callback(error)
            }

            // convery mongodb obj to plain obj before returning it
            return callback(null, character.toObject());
        })
    }
}