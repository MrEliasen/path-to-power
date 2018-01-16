export default function cmdGive(socket, command, params, Game) {
    if (params.length !== 2) {
        return Game.eventToSocket(socket, 'error', `Your must specify player and amount to give. Syntax: /give <player> <amount>`);
    }

    const playerName = params[0];
    const amount = parseInt(params[1]) || 0;

    // make sure they are giving at least 1
    if (amount <= 0) {
        return Game.eventToSocket(socket, 'error', `You must give something, you cannot leave the amount blank.`);
    }

    // get the character of the player
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get he list of characters at the grid
            const playersAtGrid = Game.characterManager.getLocationList(character.location.map, character.location.x, character.location.y);
            // find if player is in the same grid
            const receiver = playersAtGrid.find((user) => user.name.toLowerCase().indexOf(playerName) === 0);

            if (!receiver) {
                return Game.eventToSocket(socket, 'error', 'There are nobody around with that name.');
            }

            // check if they have enough money (in cash)
            if (character.stats.money < amount) {
                return Game.eventToSocket(socket, 'error', `You do not have enough money on you, to give them that much.`);
            }

            let inSameLocation = true;
            // make sure the receiver is at the same location
            Object.keys(character.location).forEach((key) => {
                if (character.location[key] !== receiver.location[key]) {
                    inSameLocation = false;
                }
            });

            // if they are not in the same location, tell them
            if (!inSameLocation) {
                return Game.eventToSocket(socket, 'error', 'You must be at the same location as the person you are giving money to.')
            }

            // remove money from giver, add it to the receiver
            character.stats.money = character.stats.money - amount;
            receiver.stats.money = receiver.stats.money + amount;

            // let them both know what happened
            Game.eventToSocket(socket, 'success', `You gave ${amount} to ${receiver.name}`);
            Game.eventToUser(receiver.user_id, 'info', `${character.name} just gave you ${amount}!`);

            // update the character stats of the two players
            Game.characterManager.updateClient(character.user_id, 'stats');
            Game.characterManager.updateClient(receiver.user_id, 'stats');
        })
        .catch(Game.logger.error);
}