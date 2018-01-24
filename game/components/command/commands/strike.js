export default function cmdStrike(socket, command, params, Game) {
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