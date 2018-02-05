function drug(character, modifiers = {}, Game) {
    const effects = Object.assign({
        exp: 0,
        health: 0
    }, modifiers);

    // check if the character has enough health to use the drug
    if ((character.stats.health + effects.health) <= 0) {
        return Game.eventToUser(character.user_id, 'warning', `You decide not to use the drug anyway, as it would probably kill you in your current state.`);
    }

    // TODO: check if there are any NPCs nearby
    // If there are any DEAs or Police officers, they should attack the player

    // give EXP and update health of player
    character.updateExp(effects.exp);
    character.updateHealth(effects.health);

    // Update the client character object
    Game.characterManager.updateClient(character.user_id, 'stats');

    // return effect event
    Game.eventToUser(character.user_id, 'info', `You use the drug. You feel the effect on your body and mind (Health: ${effects.health}, Rep: ${effects.exp})`);

    return effects;
}

/*
    "miscItemHeal"
    "miscAdrenalin"
    "miscPhone"
    "miscPepperSpray"
    "miscBeacon"
*/

module.exports = {
    drug,
};