export default function cmdAim(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    let userName = params[0].toString().toLowerCase();

    // get the character
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get he list of characters at the grid
            const playersAtGrid = Game.characterManager.getLocationList(character.location.map, character.location.x, character.location.y);
            // find if player is in the same grid
            const targetCharacter = playersAtGrid.find((user) => user.name.toLowerCase().indexOf(userName) === 0);
            if (!targetCharacter) {
                return Game.eventToSocket(socket, 'error', 'There are nobody around with that name.');
            }

            // set the new target, releasing the old target's gridlock, and gridlocking the new target.
            character.setTarget(targetCharacter);

            // get the socket of the targeted character
            Game.socketManager.get(targetCharacter.user_id)
                .then((targetSocket) => {
                    // let the player know they are aimed at
                    Game.eventToSocket(targetSocket, 'warning', `${character.name} has taken aim at you. The only way get out of this, is to kill ${character.name} or /flee <n|s|w|e>`);
                    // let the character know they have a target
                    Game.eventToSocket(socket, 'info', `You take aim at ${targetCharacter.name}. You can release your aim with /release`);
                    Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} take aim at ${targetCharacter.name}.`, [targetCharacter.user_id, character.user_id]);
                })
                .catch(Game.logger.error);
        })
        .catch(Game.logger.error);
}