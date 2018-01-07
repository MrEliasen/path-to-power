import { newEvent } from '../../socket/redux/actions';
import { updateCharacter, updateClientCharacter, killCharacter } from '../../character/redux/actions';

export default function cmdShoot(socket, params, getState, resolve, dispatch) {
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
    if (!character.equipped.ranged) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'You do not have a ranged weapon equipped.'
            }),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    // check the character has any ammo equipped
    if (!character.hasAmmo()) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'You do not have any ammunition equipped.'
            }),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    // deal damage to the target
    const itemList = getState().items.list;
    const weapon = itemList[character.equipped.ranged.id].name;
    const attack = target.dealDamage(character.fireRangedWeapon(itemList), itemList);

    if (!attack.healthLeft) {
        const messages = {
            killer: `You shoot ${target.name} with your ${weapon}, killing them.`,
            victim: `${character.name} shoots you with their ${weapon}, killing you.`,
            bystander: `You see ${character.name} kill ${target.name} with their ${weapon}`
        }
        dispatch(killCharacter(character, target, socket, messages));
        // update the clients character information, to update the ammo.
        return resolve([
            updateCharacter(character),
            {
                ...updateClientCharacter(character),
                meta: {
                    socket_id: socket.id
                }
            }
        ]);
    }

    resolve([
        // save the attacking character server-side
        updateCharacter(character),
        // save the target character server-side
        updateCharacter(target),
        // update the target client's character info
        {
            ...updateClientCharacter(target),
            meta: {
                target: target.user_id,
            }
        },
        // update the attacking client's character info
        {
            ...updateClientCharacter(character),
            meta: {
                socket_id: socket.id
            }
        },
        // send attack event to attacker/character
        {
            ...newEvent({
                type: 'system',
                message: `You shoot ${target.name} with your ${weapon}, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                socket_id: socket.id
            }
        },
        // send attack'ed event to target
        {
            ...newEvent({
                type: 'system',
                message: `${character.name} shoots you with a ${weapon}, dealing ${attack.damageDealt} damage.`
            }),
            meta: {
                target: target.user_id
            } 
        },
        // send attack event to grid
        {
            ...newEvent({
                type: 'system',
                message: `You see ${character.name} shoot ${target.name} with a ${weapon}.`
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