/**
 * The drug use effect
 * @param  {Character} character The character object of the user
 * @param  {Object}    modifiers The effect's modifiers
 * @param  {Item}      item      The item object
 * @param  {Game}      Game      The main Game object
 * @return {Object}              The use effect object
 */
function drug(character, modifiers = {}, item, Game) {
    const effects = Object.assign({
        exp: 0,
        health: 0,
    }, modifiers);

    // check if the character has enough health to use the drug
    if ((character.stats.health + effects.health) <= 0) {
        return Game.eventToUser(character.user_id, 'warning', 'You decide not to use the drug anyway, as it would probably kill you in your current state.');
    }

    // TODO: check if there are any NPCs nearby
    // If there are any DEAs or Police officers, they should attack the player

    // give EXP and update health of player
    character.updateExp(effects.exp);
    character.updateHealth(effects.health);

    // Update the client character object
    Game.characterManager.updateClient(character.user_id, 'stats');

    // return effect event
    Game.eventToUser(character.user_id, 'info', `You use the ${item.name}. You feel the effect on your body and mind (Health: ${effects.health}, Rep: ${effects.exp})`);

    return effects;
}

/**
 * The phone use effect
 * @param  {Character} character The character object of the user
 * @param  {Object}    modifiers The effect's modifiers
 * @param  {Item}      item      The item object
 * @param  {Game}      Game      The main Game object
 * @return {Object}              The use effect object
 */
function miscPhone(character, modifiers = {}, item, Game) {
    const effects = Object.assign({
        cost: 0,
    }, modifiers);

    // check if the character has enough health to use the drug
    if (character.stats.money < effects.cost) {
        return Game.eventToUser(character.user_id, 'warning', 'You do not have enough money on you, to make a call.');
    }

    // get the list of NPCS for the map
    let npclist = Game.npcManager.getLocationList(character.location.map);
    const npcTypes = ['Drug Dealer'];
    let messageArray = [
        `You use your ${item.name} to call some contacts. Your current reputation allowed you to get the following information:`,
        '----------------',
    ];

    // if they have over a certain amount of EXP, show druggies location as well.
    if (character.stats.exp > 22563) {
        npcTypes.push('Druggie');
        // overwrite the initial message
        messageArray[0] = `You use your ${item.name} to call some contacts.`;
    }

    // return only NPCs of the given types
    npclist = npclist.filter((obj) => npcTypes.includes(obj.type));

    // subtract the cost from the characters cash
    character.updateCash(effects.cost * -1);

    // Update the client character object
    Game.characterManager.updateClient(character.user_id, 'stats');

    // generate the location message, for each NPC
    messageArray = messageArray.concat(npclist.map((obj) => {
        return `${obj.name} the ${obj.type} was last seen at North ${obj.location.y} / East ${obj.location.x}`;
    }));

    // return effect event
    Game.eventToUser(
        character.user_id,
        'multiline',
        messageArray
    );
}

/**
 * The item heal effect
 * @param  {Character} character The character object of the user
 * @param  {Object}    modifiers The effect's modifiers
 * @param  {Item}      item      The item object
 * @param  {Game}      Game      The main Game object
 * @return {Object}              The use effect object
 */
function miscItemHeal(character, modifiers = {}, item, Game) {
    const effects = Object.assign({
        health: 0,
    }, modifiers);

    // if a character is at full health, don't waste the item
    if (character.stats.health >= character.stats.health_max) {
        return Game.eventToUser(character.user_id, 'info', 'You are already at full health.');
    }

    // give EXP and update health of player
    character.updateHealth(effects.health);

    // Update the client character object
    Game.characterManager.updateClient(character.user_id, 'stats');

    // return effect event
    Game.eventToUser(character.user_id, 'info', `You use the ${item.name}, and feel much better already. (Health: ${effects.health}, Rep: ${effects.exp})`);

    return effects;
}

/*
    "miscAdrenalin"
    "miscPepperSpray"
    "miscBeacon"
*/

module.exports = {
    drug,
    miscPhone,
    miscItemHeal,
};
