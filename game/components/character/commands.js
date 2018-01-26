function cmdAim(socket, command, params, Game) {
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
            const targetCharacter = playersAtGrid.find((user) => user.name.toLowerCase().indexOf(userName) === 0 && !user.hidden);
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

function cmdGive(socket, command, params, Game) {
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
            const receiver = playersAtGrid.find((user) => user.name.toLowerCase().indexOf(playerName) === 0 && !user.hidden);

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

function cmdPunch(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const target = character.target;
            // check if they have a target
            if (!target) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check the target is gridlocked by the player
            if (!target.isTargetedBy(character.user_id)) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check if the attack will hit
            if (!character.attackHit()) {
                // send event to the attacker
                Game.eventToSocket(socket, 'info', `You take a swing at ${target.name}, but miss.`);
                // send event to the target
                Game.eventToUser(target.user_id, 'info', `${character.name} takes a swing at you, but they miss.`);
                // send event to the bystanders
                return Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} take a swing at ${target.name}, but missing.`, [character.user_id, target.user_id]);
            }

            // deal damage to the target
            const attack = target.dealDamage(2, true);

            // if the target died
            if (!attack.healthLeft) {
                return Game.characterManager.kill(target.user_id, character)
                    .then((oldLocationId) => {
                        // send event to the attacker
                        Game.eventToSocket(socket, 'info', `You land the killing blow on ${target.name}. They fall to the ground, dropping everything they carried.`);
                        // send event to the target
                        Game.eventToUser(target.user_id, 'info', `${character.name} punches you, dealing ${attack.damageDealt} damage, killing you.`);
                        // send event to the bystanders
                        Game.eventToRoom(oldLocationId, 'info', `You see ${character.name} kill ${target.name} his their fists. ${target.name} fall to the ground, dropping everything they carried.`, [character.user_id]);
                    })
                    .catch(Game.logger.error);
            }

            // update the target client's character inforamtion
            Game.characterManager.updateClient(target.user_id, 'stats');
            // send event to the attacker
            Game.eventToSocket(socket, 'info', `You punch ${target.name}, dealing ${attack.damageDealt} damage.`);
            // send event to the target
            Game.eventToUser(target.user_id, 'info', `${character.name} punch you, dealing ${attack.damageDealt} damage.`);
            // send event to the bystanders
            Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} punch ${target.name}.`, [character.user_id, target.user_id]);
        })
        .catch(Game.logger.error);
}

function cmdRelease(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // if they do not have a target, simply ignore the command
            if (!character.target) {
                return Game.eventToSocket(socket, 'info', 'You do not have a target.')
            }

            const target = {
                user_id: character.target.user_id,
                name: character.target.name
            }

            // release the gridlock from the target
            character.releaseTarget()
                .then(() => {
                    // let the client know they removed their target
                    Game.eventToSocket(socket, 'info', `You no longer have ${target.name} as your target.`);
                    // get the target know they are no longer aimed at
                    Game.eventToUser(target.user_id, 'info', `${character.name} releases you from their aim.`);
                })
                .catch(Game.logger.error);
        })
        .catch(Game.logger.error)
}

function cmdShoot(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const target = character.target;
            // check if they have a target
            if (!target) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check the target is gridlocked by the player
            if (!target.isTargetedBy(character.user_id)) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check if they have a melee weapon equipped
            if (!character.equipped.ranged) {
                return Game.eventToSocket(socket, 'error', 'You do not have a ranged weapon equipped.');
            }

            // check if they have a melee weapon equipped
            if (!character.hasAmmo()) {
                return Game.eventToSocket(socket, 'error', 'You do not have any ammunition equipped.');
            }

            const weapon = character.equipped.ranged.name;

            // check if the attack will hit
            if (!character.attackHit()) {
                // send event to the attacker
                Game.eventToSocket(socket, 'info', `You shoot at ${target.name} with your ${weapon}, but misses the shot.`);
                // send event to the target
                Game.eventToUser(target.user_id, 'info', `${target.name} shoots their ${weapon} in your direction, but misses the shot.`);
                // send event to the bystanders
                return Game.eventToRoom(character.getLocationId(), 'info', `You see ${target.name} shoots their ${weapon} in ${target.name}'s direction, but misses.`, [character.user_id, target.user_id]);
            }

            // deal damage to the target
            const damage = character.fireRangedWeapon();
            const attack = target.dealDamage(damage, true);

            // if the target died
            if (!attack.healthLeft) {
                return Game.characterManager.kill(target.user_id, character)
                    .then((oldLocationId) => {
                        // send event to the attacker
                        Game.eventToSocket(socket, 'info', `You hit ${target.name} with your ${weapon}, killing them. They fall to the ground, dropping everything they carried.`);
                        // send event to the target
                        Game.eventToUser(target.user_id, 'info', `${character.name} hits you with their ${weapon}, dealing ${attack.damageDealt} damage, killing you.`);
                        // send event to the bystanders
                        Game.eventToRoom(oldLocationId, 'info', `You see ${character.name} kill ${target.name} with a ${weapon}. ${target.name} fall to the ground, dropping everything they carried.`, [character.user_id]);
                    })
                    .catch(Game.logger.error);
            }

            // update the target client's character inforamtion
            Game.characterManager.updateClient(target.user_id, 'stats');
            // send event to the attacker
            Game.eventToSocket(socket, 'info', `You shoot ${target.name} with your ${weapon}, dealing ${attack.damageDealt} damage.`);
            // send event to the target
            Game.eventToUser(target.user_id, 'info', `${character.name} shoots you with a ${weapon}, dealing ${attack.damageDealt} damage.`);
            // send event to the bystanders
            Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} shoot ${target.name} with a ${weapon}.`, [character.user_id, target.user_id]);
        })
        .catch(Game.logger.error);
}

function cmdStrike(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const target = character.target;
            // check if they have a target
            if (!target) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check the target is gridlocked by the player
            if (!target.isTargetedBy(character.user_id)) {
                return Game.eventToSocket(socket, 'error', 'You do not have a target.');
            }

            // check if they have a melee weapon equipped
            if (!character.equipped.melee) {
                return Game.eventToSocket(socket, 'error', 'You do not have a melee weapon equipped.');
            }

            const weapon = character.equipped.melee.name;

            // check if the attack will hit
            if (!character.attackHit()) {
                // send event to the attacker
                Game.eventToSocket(socket, 'info', `You take a swing at ${target.name}, with your ${weapon}, but miss.`);
                // send event to the target
                Game.eventToUser(target.user_id, 'info', `${character.name} swings their ${weapon} at you, but they miss.`);
                // send event to the bystanders
                return Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} swing their ${weapon} at ${target.name}, but missing.`, [character.user_id, target.user_id]);
            }

            // deal damage to the target
            const damage = character.getWeaponDamage('melee');
            const attack = target.dealDamage(damage, true);

            // if the target died
            if (!attack.healthLeft) {
                return Game.characterManager.kill(target.user_id, character)
                    .then((oldLocationId) => {
                        // send event to the attacker
                        Game.eventToSocket(socket, 'info', `You land the killing blow on ${target.name}, with your ${weapon}. They fall to the ground, dropping everything they carried.`);
                        // send event to the target
                        Game.eventToUser(target.user_id, 'info', `${character.name} strikes you with their ${weapon}, dealing ${attack.damageDealt} damage, killing you.`);
                        // send event to the bystanders
                        Game.eventToRoom(oldLocationId, 'info', `You see ${character.name} kill ${target.name} with a ${weapon}. ${target.name} fall to the ground, dropping everything they carried.`, [character.user_id]);
                    })
                    .catch(Game.logger.error);
            }

            // update the target client's character inforamtion
            Game.characterManager.updateClient(target.user_id, 'stats');
            // send event to the attacker
            Game.eventToSocket(socket, 'info', `You strike ${target.name} with your ${weapon}, dealing ${attack.damageDealt} damage.`);
            // send event to the target
            Game.eventToUser(target.user_id, 'info', `${character.name} strikes you with a ${weapon}, dealing ${attack.damageDealt} damage.`);
            // send event to the bystanders
            Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} strike ${target.name} with a ${weapon}.`, [character.user_id, target.user_id]);
        })
        .catch(Game.logger.error);
}

module.exports = [
    {
        commandKeys: [
            '/aim'
        ],
        method: cmdAim
    },
    {
        commandKeys: [
            '/give'
        ],
        method: cmdGive
    },
    {
        commandKeys: [
            '/punch'
        ],
        method: cmdPunch
    },
    {
        commandKeys: [
            '/release'
        ],
        method: cmdRelease
    },
    {
        commandKeys: [
            '/shoot'
        ],
        method: cmdShoot
    },
    {
        commandKeys: [
            '/strike'
        ],
        method: cmdStrike
    },
];