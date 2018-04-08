// manager specific imports
import Abilities from './abilities';

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
        // save the abilities list
        const abilities = {...character.abilities};

        // create a new array hold the abilities
        character.abilities = [];

        // set each of the abilities to the character
        character.abilities.push(new Abilities.Acc(20, abilities.acc, character.train));
    }

    /**
     * Get an ability Class object template from ability ID
     * @param  {String} abilityId ID of the ability you want
     * @return {Ability}          Ability object or null
     */
    getTemplate(abilityId) {
        if (!abilityId) {
            return null;
        }

        const id = Object.keys(Abilities).find((key) => key.toLowerCase() === abilityId.toLowerCase());

        if (!id) {
            return null;
        }

        return new Abilities[id](1, 1, false);
    }
}
