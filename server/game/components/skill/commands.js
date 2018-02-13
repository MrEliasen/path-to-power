function cmdSkillSnoop(socket, command, params, cmdObject, Game) {
    // get the character who is using the skill
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const skill = character.skills.find((obj) => obj.id === 'snoop');

            if (!skill) {
                return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
            }

            // check if they supplied a username (1 param)
            if (params.length !== 1) {
                return Game.eventToSocket(socket, 'error', `Invalid snoop target. Skill syntax: /snoop username`);
            }

            Game.characterManager.getByName(params[0])
                .then((targetCharacter) => {
                    // check if the character has an existing cooldown for this skill, if they are trying to hide
                    const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

                    if (ticksLeft) {
                        return Game.eventToUser(character.user_id, 'error', `You cannot snoop on anyone again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
                    }
                    // add the search cooldown to the character
                    Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);

                    const snoopInfo = skill.use(targetCharacter);
                    return Game.eventToSocket(socket, 'success', JSON.stringify(snoopInfo));
                })
                .catch(() => {
                    return Game.eventToSocket(socket, 'error', 'There are no players online with that name.');
                })
        })
        .catch(() => {

        });
}

function cmdSkillHide(socket, command, params, cmdObject, Game) {
    // get the character who is using the skill
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
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
        })
        .catch(() => {

        });
}

function cmdSkillSearch(socket, command, params, cmdObject, Game) {
    // get the character who is using the skill
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const skill = character.skills.find((obj) => obj.id === 'search');

            if (!skill) {
                return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
            }

            // check if they supplied a username (1 param)
            if (params.length !== 1) {
                return Game.eventToSocket(socket, 'error', `Invalid search target. Skill syntax: /search username`);
            }

            // check if the character has an existing cooldown for this skill, if they are trying to hide
            const ticksLeft = Game.cooldownManager.ticksLeft(character, `skill_${skill.id}`);

            if (ticksLeft) {
                return Game.eventToUser(character.user_id, 'error', `You cannot search again so soon. You must wait another ${(ticksLeft / 10)} seconds.`);
            }
            // add the search cooldown to the character
            Game.cooldownManager.add(character, `skill_${skill.id}`, null, true);

            // get he list of characters at the grid
            const userName = params[0].toLowerCase();

            Game.commandManager.findAtLocation(userName, character.location, false, true)
            .then((target) => {
                // check if they are hiding
                if (!target.hidden) {
                    return Game.eventToSocket(socket, 'warning', 'This player is not hiding.')
                }

                skill.use(character, target);
            })
            .catch((message) => {
                Game.eventToSocket(socket, 'error', 'You search the area but without any luck.');
            });
        })
        .catch(() => {

        });
}

module.exports = [
    {
        command: '/snoop',
        aliases: [
            '/snooping',
            '/snoopdog',
        ],
        description: 'Attempts to gather information about a target player. Usage: /snoop <player name>',
        method: cmdSkillSnoop,
    },
    {
        command: '/hide',
        aliases: [
            '/unhide',
        ],
        description: 'Hide (or re-appear if already hidden) in the given location, removing you from the player list. Usage: /hide',
        method: cmdSkillHide,
    },
    {
        command: '/search',
        aliases: [
            '/find',
        ],
        description: 'Search for a hidden player, at your current location. Usage: /search <player name>',
        method: cmdSkillSearch,
    },
];
