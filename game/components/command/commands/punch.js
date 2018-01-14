export default function cmdPunch(socket, command, params, Game) {
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

            // deal damage to the target
            const attack = target.dealDamage(2, true);

            // if the target died
            if (!attack.healthLeft) {
                return Game.characterManager.kill(target.user_id)
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