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
            if (!character.equipped.ranged) {
                return Game.eventToSocket(socket, 'error', 'You do not have a ranged weapon equipped.');
            }

            // check if they have a melee weapon equipped
            if (!character.hasAmmo()) {
                return Game.eventToSocket(socket, 'error', 'You do not have any ammunition equipped.');
            }

            // deal damage to the target
            const weapon = character.equipped.ranged.name;
            const damage = character.fireRangedWeapon();
            const attack = target.dealDamage(damage, true);

            // if the target died
            if (!attack.healthLeft) {
                /*const messages = {
                    killer: `You land a killing blow on ${target.name}.`,
                    victim: `${character.name} punches you, dealing ${attack.damageDealt} damage, killing you.`,
                    bystander: `You see ${character.name} kill ${target.name} his their fists.`
                }
                dispatch(killCharacter(character, target, socket, messages));*/
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