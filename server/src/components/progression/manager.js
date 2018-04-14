
/**
 * Handles rewarding EXP, buying upgrades and skill etc.
 */
export default class ProgressionManager {
    /**
     * Class constructor
     * @param {Game} Game The Game main component
     */
    constructor(Game) {
        this.Game = Game;
    }

    /**
     * Learn a new skill
     * @param {Character} character The character object of the character buying the skill
     * @param {String} skillId The skill ID of the skill to buy
     */
    buySkill(character, skillId) {

    }

    /**
     * Improve an already learned skill
     * @param {Character} character The character object of the character upgrade the skill
     * @param {String} skillId The skill ID of the skill to upgrade
     */
    improveSkill(character, skillId) {

    }

    /**
     * Purchase a character upgrade
     * @param {Character} character The character object of the character who is buying the upgrade
     * @param {String} upgradeId The upgrade  ID of the upgrade to buy
     */
    buyUpgrade(character, upgradeId) {

    }

    /**
     * Purchase a character upgrade improvement
     * @param {Character} character The character object of the character who upgrade to improve
     * @param {String} upgradeId The upgrade  ID of the upgrade to buy
     */
    improveUpgrade(character, upgradeId) {

    }
}
