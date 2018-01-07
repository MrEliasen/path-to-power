import { newEvent } from '../../socket/redux/actions';
import { updateCharacter, updateClientCharacter, killCharacter } from '../../character/redux/actions';

export default function cmdPunch(socket, params, getState, resolve, dispatch) {
    const character = getState().characters.list[socket.user.user_id] || null;

    if (!character) {
        return [];
    }

    if (!character.lastTarget) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'You do not have a target.'
            }),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const target = getState().characters.list[character.lastTarget];

    // if the target is not gridlocked by the character, we cannot proceed.
    if (!target.gridLocked.includes(character.user_id)) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'You do not have a target.'
            }),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    // deal damage to the target
    const attack = target.dealDamage(2, getState().items.list, true);

    if (!attack.healthLeft) {
        const messages = {
            killer: `You land a killing blow on ${target.name}.`,
            victim: `${character.name} punches you, dealing ${attack.damageDealt} damage, killing you.`,
            bystander: `You see ${character.name} kill ${target.name} his their fists.`
        }
        dispatch(killCharacter(character, target, socket, messages));
        return resolve();
    }

    resolve([
        // save the target character server-side
        updateCharacter(target),
        // update the target client's character info
        {
            ...updateClientCharacter(target),
            meta: {
                target: target.user_id,
            }
        },
        // send attack event to attacker/character
        {
            ...newEvent({
                type: 'system',
                message: `You punch ${target.name}, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                socket_id: socket.id
            }
        },
        // send attack'ed event to target
        {
            ...newEvent({
                type: 'system',
                message: `${character.name} punch you, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                target: target.user_id
            } 
        },
        // send attack event to grid
        {
            ...newEvent({
                type: 'system',
                message: `You see ${character.name} punch ${target.name}.`
            }),
            meta: {
                target: `${character.location.map}_${character.location.x}_${character.location.y}`,
                ignore: [
                    target.user_id,
                    character.user_id
                ]
            } 
        }
    ]);
}