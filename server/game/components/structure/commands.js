import {LEFT_GRID} from '../map/types';

/**
 * Heal command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdHeal(socket, character, command, params, cmdObject, Game) {
    // get the structures list at the character location
    Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
        .then((structures) => {
            // if we get multiple structures, but only one parameter, the client didnt specify
            // the structure to use the command with.
            if (structures.length > 1 && params.length <= 1) {
                return Game.eventToSocket(socket, 'error', 'Invalid structure. There are multiple structures with that command use: /heal <amount> <structure-name>');
            }

            // set the first structure by default
            let structure = structures[0];

            // overwrite if they specified a structure, and its name didn't match their criteria
            if (params.length > 1 && structure.name.toLowerCase().indexOf(structures[1].toLowerCase()) !== 0) {
                structure = structures.find((structureItem) => structureItem.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
            }

            //overwrite the command modifiers with the structure specific once.
            Object.assign(cmdObject.modifiers, structure.commands[command]);

            // if there are 2 params, the client is likely specifying the structure they want to use the command with
            // meaning the 2nd param would be the amount, and not the first.
            let heal_ticks = parseInt(params[0], 10);
            let heal_amount = heal_ticks * cmdObject.modifiers.heal_amount;

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
                heal_ticks = Math.ceil(heal_amount / cmdObject.modifiers.heal_amount);
            }

            // continue below
            const price = heal_ticks * cmdObject.modifiers.cost;

            // Check if they have the money
            if (cmdObject.modifiers.cost && price > character.stats.money) {
                return Game.eventToSocket(socket, 'error', 'You do not have enough money to heal that amount.');
            }

            // remove money and add health
            character.updateCash(price * -1);
            character.stats.health = character.stats.health + heal_amount;

            // update the client
            Game.characterManager.updateClient(character.user_id, 'stats');
            Game.eventToSocket(socket, 'success', `You healed ${heal_amount}, costing you ${price}`);
        })
        .catch((err) => {
            return Game.eventToSocket(socket, 'error', 'There are no structures around which allows you to use that command.');
        });
}

/**
 * Travel command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdTravel(socket, character, command, params, cmdObject, Game) {
    // get the structures list at the character location
    Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
        .then((structures) => {
            // if we get multiple structures, but only one parameter, the client didnt specify
            // the structure to use the command with.
            if (structures.length > 1 && params.length <= 1) {
                return Game.eventToSocket(socket, 'error', 'Invalid structure. There are multiple structures with that command use: /travel <destination name> <structure name>');
            }

            // set the first structure by default
            let structure = structures[0];

            // overwrite if they specified a structure, and its name didn't match their criteria
            if (params.length > 1 && structure.name.toLowerCase().indexOf(params[1].toLowerCase()) !== 0) {
                structure = structures.find((structureItem) => structureItem.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
            }

            const modifiers = structure.commands[command];
            let destination = params[0];
            // check if the destination exists for the airport
            if (!modifiers.destinations[destination.id]) {
                return Game.eventToSocket(socket, 'error', 'Invalid destination.');
            }

            // if there are 2 params, the client is likely specifying the structure they want to use the command with
            // meaning the 2nd param would be the amount, and not the first.
            let travel_details = modifiers.destinations[destination.id];

            // Check if they have the money
            if (travel_details.cost > character.stats.money) {
                return Game.eventToSocket(socket, 'error', 'You do not have enough money to travel there.');
            }

            // remove aim from current target, if set
            character.releaseTarget()
                .then(() => {
                    // remove money
                    character.updateCash(travel_details.cost * -1);

                    // leave the old grid room
                    socket.leave(character.getLocationId());

                    // dispatch leave message to grid
                    Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} enter the ${structure.name}, traveling to an unknown destination.`);

                    // remove player from the grid list of players
                    Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: LEFT_GRID,
                        payload: character.user_id,
                    });

                    // save the old location
                    const oldLocation = {...character.location};

                    // get the airport location on the destination map
                    const newLocation = {
                        map: destination.id,
                        x: travel_details.x,
                        y: travel_details.y,
                    };

                    // update character location
                    character.updateLocation(newLocation.map, newLocation.x, newLocation.y);

                    // change location on the map
                    Game.characterManager.changeLocation(character, newLocation, oldLocation);

                    // dispatch join message to new grid
                    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} emerge from a plane which just landed`, [character.user_id]);

                    // add player from the grid list of players
                    Game.socketManager.dispatchToRoom(
                        character.getLocationId(),
                        Game.characterManager.joinedGrid(character)
                    );

                    // update the socket room
                    socket.join(character.getLocationId());

                    // update client/socket character and location information
                    Game.characterManager.updateClient(character.user_id);

                    // send the new grid details to the client
                    Game.mapManager.updateClient(character.user_id);

                    // let the character know they traveled
                    Game.eventToSocket(socket, 'info', `You land at your new destination, at the price of ${travel_details.cost}.`);
                })
                .catch((err) => {
                    Game.logger.info(err);
                });
        })
        .catch((err) => {
            return Game.eventToSocket(socket, 'error', 'There are no structures around which allows you to use that command.');
        });
}

/**
 * Withdraw command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdWithdraw(socket, character, command, params, cmdObject, Game) {
    // get the structures list at the character location
    Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
        .then((structures) => {
            // Fetch the character first
            Game.characterManager.get(socket.user.user_id)
                .then((character) => {
                    let amount = parseInt(params[0], 10);

                    // make sure the amount is valid
                    if (isNaN(amount)) {
                        return Game.eventToSocket(socket, 'error', 'You must specify a valid amount to withdraw.');
                    }

                    // make sure the amount is a positive number
                    if (amount < 0) {
                        return Game.eventToSocket(socket, 'error', 'You must specify a positive amount to withdraw.');
                    }

                    // make sure they have that much money in the bank
                    if (character.stats.bank < amount) {
                        return Game.eventToSocket(socket, 'error', `You do not have that much in your account. You have ${character.stats.bank}.`);
                    }

                    character.updateBank(amount * -1);
                    character.updateCash(amount);

                    // update the client's character object
                    Game.characterManager.updateClient(character.user_id, 'stats');
                    Game.eventToSocket(socket, 'success', `You withdrew ${amount} from your bank account. You have ${character.stats.bank} left in your account.`);
                })
                .catch(() => {});
        })
        .catch((err) => {
            return Game.eventToSocket(socket, 'error', 'There are no structures around which allows you to use that command.');
        });
}

/**
 * Deposit command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdDeposit(socket, character, command, params, cmdObject, Game) {
    // get the structures list at the character location
    Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
        .then((structures) => {
            // Fetch the character first
            Game.characterManager.get(socket.user.user_id)
                .then((character) => {
                    let amount = parseInt(params[0], 10);

                    // make sure the amount is valid
                    if (isNaN(amount)) {
                        return Game.eventToSocket(socket, 'error', 'You must specify a valid amount to deposit.');
                    }

                    // make sure the amount is a positive number
                    if (amount < 0) {
                        return Game.eventToSocket(socket, 'error', 'You must specify a positive amount to deposit.');
                    }

                    // make sure they have that much money in the bank
                    if (character.stats.money < amount) {
                        return Game.eventToSocket(socket, 'error', `You do not have that much cash on you. You currently have ${character.stats.money} cash on you.`);
                    }

                    character.updateCash(amount * -1);
                    character.updateBank(amount);

                    // update the client's character object
                    Game.characterManager.updateClient(character.user_id, 'stats');

                    Game.eventToSocket(socket, 'success', `You deposit ${amount} into your bank account. Your account is now at ${character.stats.bank}.`);
                })
                .catch(() => {});
        })
        .catch((err) => {
            return Game.eventToSocket(socket, 'error', 'There are no structures around which allows you to use that command.');
        });
}

/**
 * Drink command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdDrink(socket, character, command, params, cmdObject, Game) {
    // Fetch the character first
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get the structures list at the character location
            Game.structureManager.getWithCommand(character.location.map, character.location.x, character.location.y, command)
                .then((structures) => {
                    // if we get multiple structures, but only one parameter, the client didnt specify
                    // the structure to use the command with.
                    if (structures.length > 1 && params.length <= 1) {
                        return Game.eventToSocket(socket, 'error', 'Invalid structure. There are multiple structures with that command use: /drink <amount> <structure-name>');
                    }

                    // set the first structure by default
                    let structure = structures[0];

                    // overwrite if they specified a structure, and its name didn't match their criteria
                    if (params.length > 1 && structure.name.toLowerCase().indexOf(structures[1].toLowerCase()) !== 0) {
                        structure = structures.find((structureItem) => structureItem.name.toLowerCase().indexOf(params[1].toLowerCase()) === 0);
                    }

                    //overwrite the command modifiers with the structure specific once.
                    Object.assign(cmdObject.modifiers, structure.commands[command]);

                    // if there are 2 params, the client is likely specifying the structure they want to use the command with
                    // meaning the 2nd param would be the amount, and not the first.
                    const drinks = parseInt(params[0], 10);
                    const exp = drinks * cmdObject.modifiers.expReward;
                    const health = drinks * cmdObject.modifiers.healthDamage;
                    const price = drinks * cmdObject.modifiers.cost;

                    // Check if the heal_amount is valid
                    if (!drinks || drinks < 1) {
                        return Game.eventToSocket(socket, 'error', 'Invalid drink amount. Syntax: /drink <amount>');
                    }

                    // Check if full health
                    if (character.stats.health <= health) {
                        return Game.eventToSocket(socket, 'warning', 'You shouldn\'t drink that much, you will die!');
                    }

                    // Check if they have the money
                    if (cmdObject.modifiers.cost && price > character.stats.money) {
                        return Game.eventToSocket(socket, 'error', 'You do not have enough money to drink that amount.');
                    }

                    // remove money and add health
                    character.updateCash(price * -1);
                    character.updateHealth(health * -1);
                    character.updateExp(exp);

                    // update the client
                    Game.characterManager.updateClient(character.user_id, 'stats');
                    Game.eventToSocket(socket, 'success', `You drink ${drinks} drinks, costing you ${price} and ${health} health. (+${exp} rep)`);
                })
                .catch((err) => {
                    return Game.eventToSocket(socket, 'error', 'There are no structures around which allows you to use that command.');
                });
        })
        .catch((err) => {
            Game.logger.debug(err);
        });
}

module.exports = [
    {
        command: '/withdraw',
        aliases: [],
        params: [
            {
                name: 'Amount',
                desc: 'The amount you wish to withdraw.',
                rules: 'required|integer|min:1',
            },
        ],
        description: 'Withdraw money from your bank account.',
        method: cmdWithdraw,
    },
    {
        command: '/deposit',
        aliases: [],
        params: [
            {
                name: 'Amount',
                desc: 'The amount you wish to deposit.',
                rules: 'required|integer|min:1',
            },
        ],
        description: 'Deposite money to your bank account.',
        method: cmdDeposit,
    },
    {
        command: '/heal',
        aliases: [],
        params: [
            {
                name: 'Amount',
                desc: 'The number of times you wish to heal.',
                rules: 'required|integer|min:1',
            },
        ],
        description: 'Regain health. Costs {cost} per {heal_amount} point(s) of health to heal.',
        method: cmdHeal,
        modifiers: {
            cost: 10,
            heal_amount: 5,
        },
    },
    {
        command: '/travel',
        aliases: [],
        params: [
            {
                name: 'Destination',
                desc: 'The name of the destination you wish to travel to.',
                rules: 'required|gamemap',
            },
            {
                name: 'Structure Name',
                desc: 'The name of the building you want to travel from.',
                rules: 'minlen:1',
            },
        ],
        description: 'Travel to another city.',
        method: cmdTravel,
        modifiers: {
            destinations: {},
        },
    },
    {
        command: '/drink',
        aliases: [],
        params: [
            {
                name: 'Amount',
                desc: 'The number of drinks you want to drink.',
                rules: 'required|integer|min:1',
            },
        ],
        description: 'Costs {cost} per drink. Gain {expReward} reputation and loose {healthDamage} health per drink.',
        method: cmdDrink,
        modifiers: {
            cost: 1,
            healthDamage: -1,
            expReward: 1,
        },
    },
];
