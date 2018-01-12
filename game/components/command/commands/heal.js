export default function cmdHeal(socket, command, params, Game) {
    // Fetch the character first
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // load the commands details modifiers
            Game.commandManager.get(command)
                .then((commandObj) => {
                    // get the structures list at the character location
                    Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
                        .then((structures) => {
                            // if we get multiple structures, but only one parameter, the client didnt specify
                            // the structure to use the command with.
                            if (structures.length > 1 && params.length <= 1) {
                                return Game.eventToSocket(socket, 'error', 'Invalid structure. There are multiple structures with that command use: /heal <amount> <structure-nane>');
                            }

                            // set the first structure by default
                            let structure = structures[0];

                            // if there are more than 1 structure and we 
                            if (structures.length > 1) {
                                structure = structures.find((obj) => obj.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
                            }

                            // overwrite if they specified a structure, and its name didn't match their criteria
                            if (params.length > 1 && structure.name.toLowerCase().indexOf(structures[1].toLowerCase()) !== 0) {
                                structure = structures.find((structureItem) => structureItem.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
                            }

                            //overwrite the command modifiers with the structure specific once.
                            Object.assign(commandObj.modifiers, structure.commands[command]);

                            // if there are 2 params, the client is likely specifying the structure they want to use the command with
                            // meaning the 2nd param would be the amount, and not the first.
                            let heal_ticks = parseInt(params[0]);
                            let heal_amount = heal_ticks * commandObj.modifiers.heal_amount;

                            // Check if the heal_amount is valid
                            if (!heal_ticks || heal_ticks < 1) {
                                return Game.eventToSocket(socket, 'error', 'Invalid heal amount. Syntax: /heal <amount>');
                            }

                            // Check if full health
                            if (character.stats.health === character.stats.health_max) {
                                return Game.eventToSocket(socket, 'warning', 'You are already at full health!');
                            }

                            // Check if the heal would exceed 100%, if so, cap it.
                            if ((character.stats.health + heal_amount) > character.stats.health_max) {
                                heal_amount = (character.stats.health_max - character.stats.health);
                                heal_ticks = Math.ceil(heal_amount / commandObj.modifiers.heal_amount);
                            }

                            // continue below
                            const price = heal_ticks * commandObj.modifiers.cost;

                            // Check if they have the money
                            if (commandObj.modifiers.cost && price > character.stats.money) {
                                return Game.eventToSocket(socket, 'error', 'You do not have enough money to heal that amount.');
                            }

                            // remove money and add health
                            character.stats.money = character.stats.money - price;
                            character.stats.health = character.stats.health + heal_amount;

                            // update the client
                            Game.characterManager.updateClient(character.user_id);
                            Game.eventToSocket(socket, 'success', `You healed ${heal_amount}, costing you ${price}`);
                        })
                        .catch(Game.logger.debug)
                })
                .catch(Game.logger.debug)
        })
        .catch(Game.logger.debug)
}