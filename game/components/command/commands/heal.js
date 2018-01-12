export default function cmdHeal(socket, command, params, Game) {
    // if there are 2 params, the client is likely specifying the structure they want to use the command with
    // meaning the 2nd param would be the amount, and not the first.
    let healAmount = parseInt(params[0]);

    // Check if the healAmount is valid
    if (!healAmount || healAmount < 1) {
        return this.Game.eventToSocket(socket, 'error', 'Invalid heal amount. Syntax: /heal <amount>');
    }

    // Fetch the character first
    Game.characterManager.get(socket.user.user_id).then((character) => {
        // Check if full health
        if (character.stats.health === character.stats.health_max) {
            return this.Game.eventToSocket(socket, 'warning', 'You are already at full health!');
        }

        // Check if the heal would exceed 100%, if so, cap it.
        if ((character.stats.health + healAmount) > character.stats.health_max) {
            healAmount = character.stats.health_max - character.stats.health;
        }

        // get the structures list at the character location
        Game.structureManager.getWithCommand(...character.location, command).then((structures) => {
            // if we get multiple structures, but only one parameter, the client didnt specify
            // the structure to use the command with.
            if (structures.length > 1 && params.length <= 1) {
                return this.Game.eventToSocket(socket, 'error', 'Invalid structure. There are multiple structures with that command use: /heal <amount> <structure-nane>');
            }

            // set the first structure by default
            let structure = structures[0];

            // overwrite if they specified a structure, and its name didn't match their criteria
            if (params.length > 1 && structure.name.toLowerCase().indexOf(structures[1].toLowerCase()) !== 0) {
                structure = structures.find((structureItem) => structureItem.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
            }



            // TODO: CONTINUE TOMORROW!
            // load building command modifiers
            // load command default modifiers
            // continue below



            const price = healAmount * actionModifiers.cost;

            // Check if they have the money
            if (actionModifiers.cost && price > character.stats.money) {
                return this.Game.eventToSocket(socket, 'error', 'You do not have enough money to heal that amount.');
            }

            // remove money and add health
            character.stats.money = character.stats.money - price;
            character.stats.health = character.stats.health + healAmount;

            return resolve([
                updateCharacter(character),
                {
                    ...newEvent(`You healed ${healAmount}, costing you ${price}`),
                    meta,
                },
                {
                    ...updateClientCharacter(character),
                    meta
                }
            ])
        })
        .catch(Game.logger.debug)
    })
    .catch(Game.logger.debug)
}