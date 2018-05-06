import {
    CHARACTER_LEFT_GRID,
} from 'shared/actionTypes';

/**
 * Hide skill logic
 */
export default class SkillHide {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'hide';
        this.name = 'Hide';
        this.command = '/hide';
        this.description = 'Description placeholder';
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
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                expCost: 1000,
                description: 'Search desc 1.',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Search desc 2.',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Search desc 3.',
            },
        ];
    }

    /**
     * Hides the character from the grid player list
     * @param  {Character} targetCharacter The skill "owner"
     */
    use(character) {
        // make sure they are not grid locked
        if (character.targetedBy.length) {
            const list = character.targetedBy.map((obj) => {
                return obj.name;
            }).join(', ');

            return this.Game.eventToUser(character.user_id, 'warning', `You can't hide while the following players are aiming at you: ${list}`);
        }

        // hide the player from the grid playerlist
        character.hidden = character.hidden ? false : true;

        // dispatch events to the user and the grid, depending on the hidden state
        if (character.hidden) {
            this.Game.eventToUser(character.user_id, 'success', 'You are now in hiding. Anyone else who was here would have seen you hide. (they will still need to /search to find you however)');
            this.Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} run into an alley and disappear.`, [character.user_id]);

            // re-add the character to the grid player list
            this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                type: CHARACTER_LEFT_GRID,
                payload: character.user_id,
            });

            // train the skill
            this.train();
        } else {
            this.Game.eventToUser(character.user_id, 'success', 'You are no longer hiding.');
            this.Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} appear from one of the alleys`, [character.user_id]);

            // re-add the character to the grid player list
            this.Game.socketManager.dispatchToRoom(
                character.getLocationId(),
                this.Game.characterManager.joinedGrid(character),
            );
        }
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
