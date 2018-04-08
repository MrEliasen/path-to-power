import {
    CHARACTER_JOINED_GRID,
} from 'shared/actionTypes';

/**
 * Search Skill logic
 */
export default class SkillSearch {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers) {
        this.Game = Game;
        this.id = 'search';
        this.name = 'Search';
        this.command = '/search';
        this.value = 1;
        this.improve = true;

        Object.assign(this, {...modifiers});
    }

    /**
     * Get the skill's modifieres
     * @return {[type]} [description]
     */
    getModifiers() {
        return {
            value: this.value,
        };
    }

    /**
     * Removes a character from player hiding
     * @param  {Character} character The skill user
     */
    use(character) {
        this.Game.characterManager
            .getLocationList(character.location.map, character.location.x, character.location.y, character.user_id, true)
                .then((characterList) => {
                    let found = 0;

                    characterList.forEach((characterObj) => {
                        if (!characterObj.hidden) {
                            return;
                        }

                        const hidingSkill = characterObj.skills.find((obj) => obj.id === 'hide').value;
                        // 50% chance by default
                        const baseChance = 0.5;
                        // Each point heigher search than hide is an additional 25% chance to find them.
                        // Each point lower reduces the chance by 25%.
                        let bonus = ((this.value - hidingSkill) * 25) / 100;
                        // get the calculated chance to find the player
                        let chance = baseChance + bonus;

                        if (Math.random() > chance) {
                            return;
                        }

                        // keep track of how many/if we found anyone yet
                        found++;

                        // yank the player out of hiding
                        characterObj.hidden = false;

                        this.Game.eventToUser(character.user_id, 'success', `You spot ${character.name} hidding in a nearby alley.`);
                        this.Game.eventToUser(characterObj.user_id, 'info', `Despite your efforts, ${character.name} found your hiding spot. You are no longer hidden.`);
                        this.Game.eventToRoom(character.getLocationId(), 'info', `You hear ${character.name} shout they found ${characterObj.name}.`, [character.user_id, characterObj.user_id]);

                        // re-add the character to the grid player list
                        this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                            type: CHARACTER_JOINED_GRID,
                            payload: {
                                name: characterObj.name,
                                user_id: characterObj.user_id,
                            },
                        });

                        // train the skill
                        if (character.train) {
                            this.train();
                        }
                    });

                    if (!found) {
                        return this.Game.eventToUser(character.user_id, 'info', 'You search the area but without any luck.');
                    }
                })
                .catch(() => {
                    return this.Game.eventToUser(character.user_id, 'info', 'You search the area but without any luck.');
                });
    }

    /**
     * Increase the skill by the training amount
     */
    train() {
        if (!this.improve) {
            return;
        }

        // this is how much the skill should increment when used.
        // Round the new value to 5 decimal points
        this.value = this.value + Math.round(
            Math.round(
                (0.015 / this.value) * 100000
            )
        ) / 100000;
    }
}
