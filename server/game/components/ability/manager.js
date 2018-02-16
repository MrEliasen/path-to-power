import Promise from 'bluebird';

// manager specific imports
import AbilityAccuracy from './abilities/accuracy';

/**
 * Handles the management of assigning abilities to characters
 */
export default class AbilityManager {
    /**
     * Class constructore
     * @param  {Game} Game The Game object
     */
    constructor(Game) {
        this.Game = Game;
    }

    /**
     * Loads the characters abilities
     * @param  {Character} character The character object to load abilities for
     * @return {Promise}
     */
    load(character) {
        return new Promise((resolve, reject) => {
            // save the abilities list
            const abilities = {...character.abilities};

            // create a new array hold the abilities
            character.abilities = [];

            // set each of the abilities to the character
            // TODO: interrate over the object and instanciate a new ability matching the key
            character.abilities.push(new AbilityAccuracy(20, abilities.acc, character.train));

            resolve();
        });
    }
}
