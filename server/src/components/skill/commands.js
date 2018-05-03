/**
 * Snoop skill command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdSkillSnoop(socket, character, command, params, cmdObject, Game) {
    const skill = character.skills.find((obj) => obj.id === 'snoop');

    if (!skill) {
        return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
    }

    const targetCharacter = params[0];

    // check if the character has an existing cooldown for this skill, if they are trying to hide
    const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You cannot snoop on anyone again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
    }
    // add the search cooldown to the character
    Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);

    const snoopInfo = skill.use(targetCharacter);
    return Game.eventToSocket(socket, 'multiline', snoopInfo);
}

/**
 * First Aid skill command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdSkillFirstAid(socket, character, command, params, cmdObject, Game) {
    const skill = character.skills.find((obj) => obj.id === 'firstaid');

    if (!skill) {
        return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
    }

    // check if the character has an existing cooldown for this skill
    const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You cannot use first aid again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
    }

    let targetCharacter = params[0] || character;
    const amountHealed = skill.use(targetCharacter);

    // add the search cooldown to the character
    Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);

    // Make sure the target character is no the character who used the skill
    if (params[0] && params[0].user_id !== character.user_id) {
        Game.eventToSocket(socket, 'success', `You healed ${targetCharacter.name}, recovering ${amountHealed} health.`);
        Game.eventToUser(targetCharacter.user_id, 'success', `${character.name} healed you, recovering ${amountHealed} health.`);
        // update the target character client
        Game.characterManager.updateClient(targetCharacter.user_id);
    } else {
        Game.eventToSocket(socket, 'success', `You healed yourself, recovering ${amountHealed} health.`);
    }

    // update the skill users client
    Game.characterManager.updateClient(character.user_id);
}

/**
 * Hide skill command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdSkillHide(socket, character, command, params, cmdObject, Game) {
    const skill = character.skills.find((obj) => obj.id === 'hide');

    if (!skill) {
        return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
    }

    // check if the character has an existing cooldown for this skill, if they are trying to hide
    if (!character.hidden) {
        const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

        if (ticksLeft) {
            return Game.eventToUser(character.user_id, 'error', `You cannot hide again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
        }
    } else {
        // set the cooldown of the skill, when they come out of hiding
        Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);
    }

    skill.use(character);
}

/**
 * Search skill command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdSkillSearch(socket, character, command, params, cmdObject, Game) {
    const skill = character.skills.find((obj) => obj.id === 'search');

    if (!skill) {
        return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
    }

    // check if the character has an existing cooldown for this skill, if they are trying to hide
    const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You cannot search again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
    }
    // add the search cooldown to the character
    Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);

    skill.use(character);
}

module.exports = [
    {
        command: '/snoop',
        aliases: [
            '/snooping',
            '/snoopdog',
        ],
        params: [
            {
                name: 'Target',
                desc: 'The target player you wish to snoop on.',
                rules: 'required|player',
            },
        ],
        description: 'Attempts to gather information about a target player.',
        method: cmdSkillSnoop,
    },
    {
        command: '/hide',
        aliases: [
            '/unhide',
        ],
        description: 'Hide (or re-appear if already hidden) in the given location, removing you from the player list.',
        method: cmdSkillHide,
    },
    {
        command: '/firstaid',
        aliases: [
            '/aid',
        ],
        params: [
            {
                name: 'Target',
                desc: 'The target you wish to heal. If left empty, you target yourself.',
                rules: 'player:grid',
            },
        ],
        description: 'Heal yourself or another character for some amount of health.',
        method: cmdSkillFirstAid,
    },
    {
        command: '/search',
        aliases: [
            '/find',
        ],
        params: [],
        description: 'Search for a hidden players at your current location.',
        method: cmdSkillSearch,
    },
];
