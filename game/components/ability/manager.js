import Promise from 'bluebird';

// manager specific imports
import AbilityAccuracy from './abilities/accuracy';

export default class AbilityManager {
    constructor(Game) {
        this.Game = Game;

        // The list of all abilities currently managed (Players and NPCs)
        this.abilities = [];
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
            // clear the list and make an array, which will hold our abilities
            character.abilities = [];
            // set each of the abilities to the character
            character.abilities.push(new AbilityAccuracy(20, abilities.acc));

            resolve();
        });
    }
}