import {
    CHARACTER_JOINED_GRID,
} from 'shared/actionTypes';

/**
 * Search Skill logic
 */
export default class SkillTracking {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'tracking';
        this.name = 'Tracking';
        this.description = 'Enables you to /track the position a target, and force them out of hiding.';
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
                description: 'Allows you to track anyone with level 0 hiding.',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Allows you to track anyone with level 1 hiding.',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Allows you to track anyone with level 2 hiding.',
            },
            {
                tier: 4,
                expCost: 10000,
                description: 'Allows you to track anyone with level 3 hiding.',
            },
        ];
    }

    /**
     * Removes a character from player hiding
     * @param  {Character} character The skill user
     */
    use(character, target) {
        const targetMap = this.Game.mapManager.get(target.location.map);
        const targetSill = target.skills.find((obj) => obj.id === 'hiding');
        let sameGrid = true;
        let foundTarget = false;

        if (target.location.map !== character.location.map ||
            target.location.y !== character.location.y ||
            target.location.x !== character.location.x
        ) {
            sameGrid = false;
        }

        if (targetSill && targetSill.value >= this.value) {
            foundTarget = Math.random() < 0.1;
        } else {
            foundTarget = true;
        }

        if (!foundTarget) {
            return this.Game.eventToUser(character.user_id, 'info', `You check with your contacts, but none of them had any fresh info on ${target.name} at this time.`);
        }

        if (!sameGrid) {
            return this.Game.eventToUser(character.user_id, 'info', `You check with your contacts, and find that ${target.name} was last seen in ${targetMap.name} around N${target.location.y}/E${target.location.x}`);
        }

        if (!target.hidden) {
            return this.Game.eventToUser(character.user_id, 'info', `No need to contact anyone, you see ${target.name} standing close to your.`);
        }

        // yank the player out of hiding
        target.hidden = false;

        // apply the hide cooldown to the target
        this.Game.cooldownManager.add(target, 'skill_hiding', null, true);

        this.Game.eventToUser(character.user_id, 'success', `You spot ${target.name} hidding in a nearby alley, forcing them to leave their hiding spot.`);
        this.Game.eventToUser(target.user_id, 'info', `Despite your efforts, ${character.name} managed to track you down. You are no longer hidden.`);

        this.Game.eventToRoom(character.getLocationId(), 'info', `You hear ${character.name} shout they found ${target.name}.`, [character.user_id, target.user_id]);

        // re-add the character to the grid player list
        this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
            type: CHARACTER_JOINED_GRID,
            payload: {
                name: target.name,
                user_id: target.user_id,
                ignore: target.user_id,
            },
        });
    }
}
