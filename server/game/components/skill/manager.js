// manager specific imports
import SkillList from './skills';
import skillCommands from './commands';

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
        console.log('SKILL MANAGER LOADED');
    }

    /**
     * Returns a list of base skills all new characters begins with
     * @return {array}
     */
    getDefaults() {
        // NOTE: set the default skills for new players here
        return [
            {
                id: 'snoop',
                modifiers: {
                    value: 1,
                },
            },
            {
                id: 'hide',
                modifiers: {
                    value: 1,
                },
            },
            {
                id: 'search',
                modifiers: {
                    value: 1,
                },
            },
        ];
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
        const playerSkills = character.skills ? {...character.skills} : {};
        // get the default skills, and overwrite their values (if any) with the value of the players matching skill
        let skills = this.getDefaults().map((obj) => {
            // check if the player has that skill already
            if (playerSkills[obj.id]) {
                // if so, overwrite the default value
                Object.assign(obj.modifiers, {...playerSkills[obj.id].modifiers});
                // remove the skill from the list, so we dont end up with 2 of the same skill when we merge in the
                // rest of the skills the player might have, which are not part of the defaults
                delete playerSkills[obj.id];
            }

            return obj;
        });

        // merge the rest of the player skills which are not part of the defaults
        skills = skills.concat(Object.values(playerSkills));

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
}
