function cmdSkillSnoop(socket, command, params, Game) {
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

function cmdSkillHide(socket, command, params, Game) {
    // get the character who is using the skill
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const skill = character.skills.find((obj) => obj.id === 'hide');

            if (!skill) {
                return Game.eventToSocket(socket, 'error', 'You do not have this skill.');
            }

            skill.use(character);
        })
        .catch(() => {

        });
}

function cmdSkillSearch(socket, command, params, Game) {
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

            // get he list of characters at the grid
            const playersAtGrid = Game.characterManager.getLocationList(character.location.map, character.location.x, character.location.y);

            // find if player is in the same grid
            const userName = params[0].toLowerCase();
            const targetCharacter = playersAtGrid.find((user) => user.name.toLowerCase().indexOf(userName) === 0);

            // check if they are even in the area.
            if (!targetCharacter) {
                return Game.eventToSocket(socket, 'info', `You search the area for ${targetCharacter.name}, but without luck.`);
            }

            // check if they are hiding
            if (!targetCharacter.hidden) {
                return this.Game.eventToSocket(socket, 'warning', 'This player is not hiding.')
            }

            skill.use(character, targetCharacter);
        })
        .catch(() => {

        });
}

module.exports = [
    {
        commandKeys: [
            '/snoop',
            '/snooping'
        ],
        method: cmdSkillSnoop
    },
    {
        commandKeys: [
            '/hide',
            '/unhide'
        ],
        method: cmdSkillHide
    },
    {
        commandKeys: [
            '/search',
            '/find'
        ],
        method: cmdSkillSearch
    }
];