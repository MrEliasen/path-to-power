// manager specific imports
import EnhancementsList from './enhancements';

// action types
import {ENHANCEMENT_PURCHASE} from 'shared/actionTypes';

/**
 * Skill manager
 */
export default class EnhancementManager {
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
        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
        this.Game.logger.debug('EnhancementManager::constructor Loaded');
    }

    /**
     * Parses a client action
     * @param {Socket.io Socket} socket The client socket the request is made from
     * @param {Object} action Redux action object
     */
    onDispatch(socket, action) {
        switch (action.type) {
            case ENHANCEMENT_PURCHASE:
                return this.purchase(socket, action);
        }
    }

    /**
     * Generate an enhancement from its template.
     * @param  {Object} enhancement The plain enhancement object for the skill
     * @return {Enhancement Obj}    The enhancement object for the new enhancement
     */
    new(enhancement) {
        const EnhTemplate = EnhancementsList[enhancement.id];

        if (!EnhTemplate) {
            return null;
        }

        return new EnhTemplate(this.Game, enhancement.modifiers);
    }

    /**
     * Loads a characters enhancements, or create a new setup if its the first time.
     * @param  {Character} character The character obj to load skills for
     * @return {Promise}
     */
    load(character) {
        // save the players enhancement list
        const characterEnhList = character.enhancements ? [...character.enhancements] : [];

        // prepare the array which will keep the instanciated enhancements
        character.enhancements = [];

        // clear the list and make an array, which will hold our skills
        characterEnhList.forEach((enhancement) => {
            let newEnhancement = this.new(enhancement);

            if (newEnhancement) {
                character.enhancements.push(newEnhancement);
            }
        });

        character.timers.push({
            name: 'enhancementPoints',
            timer: setInterval(this.onPointsInterval, this.Game.config.game.enhancement.intervalDuration, character),
        });
    }

    /**
     * Give enhancement points to a character at the end of each point interval
     * @param {Character} character the character to give points to
     */
    onPointsInterval = (character) => {
        /* eslint-disable no-invalid-this */
        const pointsReward = this.Game.config.game.enhancement.intervalPoints;

        character.updateEnhPoints(pointsReward);
        this.Game.characterManager.updateClient(character.user_id);
        this.Game.eventToUser(character.user_id, 'info', `Thank you for playing! You have been awarded ${pointsReward} enhancement points!`);
        /* eslint-enable no-invalid-this */
    }

    /**
     * Get the list of all enhancements
     */
    getList = () => {
        return Object.values(EnhancementsList).map((Enhancement) => {
            const EnhObj = new Enhancement();

            return {
                id: EnhObj.id,
                name: EnhObj.name,
                description: EnhObj.description,
                tree: EnhObj.getTree(),
            };
        });
    }

    /**
     * Buy a new/upgrade enhancement
     * @param {Object} action redux action object
     */
    purchase(socket, action) {
        const character = this.Game.characterManager.get(socket.user.user_id);

        if (!character) {
            return;
        }

        const tier = parseInt(action.payload.tier, 10);
        const enhId = action.payload.enhId;
        const characterEnhancement = character.enhancements.find((obj) => obj.id === enhId);

        // If the character does not have the enhancement already, and the tier they are trying to buy
        // is not tier 1, error out.
        if (!characterEnhancement && tier !== 1) {
            return this.Game.eventToUser(character.user_id, 'error', 'You can only purchase the first tier of this enhancement as you do not own it yet.');
        }

        // If the character owns the enhancement, make sure the tier they are trying to buy
        // is the next level
        if (characterEnhancement && characterEnhancement.value + 1 !== tier) {
            return this.Game.eventToUser(character.user_id, 'error', `You cannot buy a tier higher than ${characterEnhancement.value + 1} for this enhancement.`);
        }

        const newEnh = this.new({
            id: enhId,
            modifiers: {
                value: tier,
            },
        });

        if (!newEnh) {
            return this.Game.eventToUser(character.user_id, 'error', 'That enhancement does not exist.');
        }

        const enhTiers = newEnh.getTree();
        const tierDetails = enhTiers.find((obj) => obj.tier === tier);

        // check if the tier exists
        if (!tierDetails) {
            return this.Game.eventToUser(character.user_id, 'error', 'That enhancement does not have that tier.');
        }

        // check if the character has enough experience to purchase the enhancement level
        if (character.stats.enhPoints < tierDetails.enhPointsCost) {
            return this.Game.eventToUser(character.user_id, 'error', 'You do not have enough Enhancement Points to buy this tier.');
        }

        // remove the exp from the character
        character.updateEnhPoints(tierDetails.enhPointsCost * -1);

        // if the character does not own the enhancement already, add it, otherwise set the new enhancement tier.
        if (!characterEnhancement) {
            character.enhancements.push(newEnh);
        } else {
            characterEnhancement.value = tier;
        }

        this.Game.characterManager.updateClient(socket.user.user_id);
    }
}
