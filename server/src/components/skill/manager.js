// manager specific imports
import SkillList from './skills';
import skillCommands from './commands';

// action types
import {SKILL_PURCHASE} from 'shared/actionTypes';

/**
 * Skill manager
 */
export default class SkillManager {
    /**
     * class constructor
     * @param  {Game} Game The game object
     */
    constructor(Game) {
        this.Game = Game;
    }

    /**
     * Load all skill commands
     * @return {Promise}
     */
    init() {
        this.Game.commandManager.registerManager(skillCommands);
        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
        this.Game.logger.debug('SkillManager::constructor Loaded');
    }

    /**
     * Parses a client action
     * @param {Socket.io Socket} socket The client socket the request is made from
     * @param {Object} action Redux action object
     */
    onDispatch(socket, action) {
        switch (action.type) {
            case SKILL_PURCHASE:
                return this.purchaseSkill(socket, action);
        }
    }

    /**
     * Returns a list of base skills all new characters begins with
     * @return {array}
     */
    getDefaults() {
        // NOTE: set the default skills for new players here
        return [];
    }

    /**
     * Generate a skill from its template.
     * @param  {Object} skill The plain skill object for the skill
     * @return {Skill Obj}    The skill object for the new skill
     */
    new(skill) {
        const SkillTemplate = SkillList[skill.id];

        if (!SkillTemplate) {
            return null;
        }

        return new SkillTemplate(this.Game, skill.modifiers);
    }

    /**
     * Loads a characters skills, or create a new setup if its the first time.
     * @param  {Character} character The character obj to load skills for
     * @return {Promise}
     */
    load(character) {
        // save the players skills list
        const characterSkills = character.skills ? {...character.skills} : {};
        // get the default skills, and overwrite their values (if any) with the value of the players matching skill
        let skills = this.getDefaults().map((obj) => {
            // check if the player has that skill already
            if (characterSkills[obj.id]) {
                // if so, overwrite the default value
                Object.assign(obj.modifiers, {...characterSkills[obj.id].modifiers});
                // remove the skill from the list, so we dont end up with 2 of the same skill when we merge in the
                // rest of the skills the player might have, which are not part of the defaults
                delete characterSkills[obj.id];
            }

            return obj;
        });

        // merge the rest of the player skills which are not part of the defaults
        skills = skills.concat(Object.values(characterSkills));

        // prepare the array for the instanciated skills
        character.skills = [];

        // clear the list and make an array, which will hold our skills
        skills.forEach((skill) => {
            let newSkill = this.new(skill);

            newSkill.improve = character.train;

            if (newSkill) {
                character.skills.push(newSkill);
            }
        });
    }

    /**
     * Get the list of all skills
     */
    getSkills() {
        return Object.values(SkillList).map((Skill) => {
            const SkillObj = new Skill();

            return {
                id: SkillObj.id,
                name: SkillObj.name,
                description: SkillObj.description,
                tree: SkillObj.getTree(),
            };
        });
    }

    /**
     * Learn a new skill
     * @param {Object} action redux action object
     */
    purchaseSkill(socket, action) {
        const character = this.Game.characterManager.get(socket.user.user_id);

        if (!character) {
            return;
        }

        const tier = parseInt(action.payload.tier, 10);
        const skillId = action.payload.skillId;
        const characterSkill = character.skills.find((obj) => obj.id === skillId);

        // If the character does not have the skill already, and the tier they are trying to buy
        // is not tier 1, error out.
        if (!characterSkill && tier !== 1) {
            return this.Game.eventToUser(character.user_id, 'error', 'You can only purchase the first tier of this skill as you do not own it yet.');
        }

        // If the character owns the skill, make sure the tier they are trying to buy
        // is the next level
        if (characterSkill && characterSkill.value + 1 !== tier) {
            return this.Game.eventToUser(character.user_id, 'error', `You cannot buy a tier higher than ${characterSkill.value + 1} for this skill.`);
        }

        const newSkill = this.new({
            id: skillId,
            modifiers: {
                value: tier,
            },
        });

        if (!newSkill) {
            return this.Game.eventToUser(character.user_id, 'error', 'That skill does not exist.');
        }

        const skillTiers = newSkill.getTree();
        const tierDetails = skillTiers.find((obj) => obj.tier === tier);

        // check if the tier exists
        if (!tierDetails) {
            return this.Game.eventToUser(character.user_id, 'error', 'That skill does not have that tier.');
        }

        // check if the character has enough experience to purchase the skill level
        if (character.stats.exp < tierDetails.expCost) {
            return this.Game.eventToUser(character.user_id, 'error', 'You do not have enough exp to buy this tier.');
        }

        // remove the exp from the character
        character.updateExp(tierDetails.expCost * -1, false);

        // if the character does not own the skill already, add it, otherwise set the new skill tier.
        if (!characterSkill) {
            character.skills.push(newSkill);
        } else {
            characterSkill.value = tier;
        }

        this.Game.characterManager.updateClient(socket.user.user_id);
    }
}
