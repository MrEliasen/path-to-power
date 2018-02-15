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
    return Game.eventToSocket(socket, 'success', JSON.stringify(snoopInfo));
}

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

    // get he list of characters at the grid
    const target = params[0];

    // check if they are hiding
    if (!target.hidden) {
        return Game.eventToSocket(socket, 'warning', 'This player is not hiding.');
    }

    skill.use(character, target);
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
        command: '/search',
        aliases: [
            '/find',
        ],
        params: [
            {
                name: 'Target',
                desc: 'The target player you are searching for.',
                rules: 'required|player:grid',
            },
        ],
        description: 'Search for a hidden player, at your current location.',
        method: cmdSkillSearch,
    },
];
