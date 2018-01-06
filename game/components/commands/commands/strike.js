import { newEvent } from '../../socket/redux/actions';
import { updateCharacter, updateClientCharacter } from '../../character/redux/actions';

export default function cmdStrike(socket, params, getState, resolve) {
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

    // make sure they have a melee weapon equipped
    if (!character.equipped.melee) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'You do not have a melee weapon equipped.'
            }),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    // deal damage to the target
    const itemList = getState().items.list;
    const weapon = itemList[character.equipped.melee.id].name;
    const attack = target.dealDamage(character.getWeaponDamage('melee', itemList), itemList, false);

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
                message: `You strike ${target.name} with your ${weapon}, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                socket_id: socket.id
            }
        },
        // send attack'ed event to target
        {
            ...newEvent({
                type: 'system',
                message: `${character.name} strikes you with a ${weapon}, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                target: target.user_id
            } 
        },
        // send attack event to grid
        {
            ...newEvent({
                type: 'system',
                message: `You see ${character.name} strike ${target.name} with a ${weapon}.`
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