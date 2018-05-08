import {
    CHARACTER_LEFT_GRID,
} from 'shared/actionTypes';

/**
 * Hide skill logic
 */
export default class SkillHiding {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'hiding';
        this.name = 'Hiding';
        this.command = '/hide';
        this.description = 'Allows you to /hide your presence from others in a specific grid. ';
        this.value = 0;

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
                description: 'Trackers level 1 and down, have 10% chance to find you. Trackers level 2+ have 100% chance.',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Trackers level 2 and down, have 10% chance to find you. Trackers level 3+ have 100% chance.',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Trackers level 3 and down, have 10% chance to find you. Trackers level 4 have 100% chance.',
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
                return obj.name + (obj.npc_id ? ` the ${obj.type}` : '');
            });

            return this.Game.eventToUser(character.user_id, 'warning', `You can't hide while being aim'ed at by: ${list.join(', ')}`);
        }

        // hide the player from the grid playerlist
        character.hidden = character.hidden ? false : true;

        // dispatch events to the user and the grid, depending on the hidden state
        if (character.hidden) {
            this.Game.eventToUser(character.user_id, 'success', 'You are now in hiding.');
            this.Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} run into an alley and disappear.`, [character.user_id]);

            // re-add the character to the grid player list
            this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                type: CHARACTER_LEFT_GRID,
                payload: character.user_id,
            });
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
}
