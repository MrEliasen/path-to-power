import { clientCommandError } from '../redux/actions';
import { newEvent } from '../../socket/redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';

export default function cmdAim(socket, params, getState, resolve) {
    // fetch the client, create the target to search for and set the meta for default socket returns.
    const character = getState().characters.list[socket.user.user_id] || null;
    const target = params.join(' ').trim().toLowerCase();
    const meta = {
        socket_id: socket.id
    }

    // if not character exists (this should never trigger however, monkaS)
    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character, please logout and back in to resolve.'),
            meta
        }]);
    }

    // if not target was specified, let the player know.
    if (!target) {
        return resolve([{
            ...clientCommandError('Invalid target.'),
            meta
        }]);
    }

    // get the locations of player
    const playerLocations = getState().characters.locations;

    // make sure the grid is defined (it should be, the player is there)
    if (!playerLocations[character.location.map]) {
        return resolve([{
            ...clientCommandError('Invalid grid.'),
            meta
        }]);
    }
    if (!playerLocations[character.location.map][character.location.y]) {
        return resolve([{
            ...clientCommandError('Invalid grid.'),
            meta
        }]);
    }
    if (!playerLocations[character.location.map][character.location.y][character.location.x]) {
        return resolve([{
            ...clientCommandError('Invalid grid.'),
            meta
        }]);
    }

    // load the players on the specified grid
    const playerGrid = playerLocations[character.location.map][character.location.y][character.location.x];

    // check if player is at the given grid
    const playerId = Object.keys(playerGrid).find((playerId) => playerGrid[playerId].toLowerCase().indexOf(target) !== -1);

    if (!playerId) {
        return resolve([{
            ...clientCommandError('You look around, but you see no one with that name.'),
            meta
        }]);
    }

    // fetch the target player object
    const targetPlayer = getState().characters.list[playerId];

    // apply the "grid-lock" active effect to the character
    targetPlayer.gridLock(character.user_id);

    // send event messages to the grid.
    return resolve([
        updateCharacter(targetPlayer),
        {
            ...updateClientCharacter(targetPlayer),
            meta: {
                target: targetPlayer.user_id
            }
        },
        {
            ...newEvent({
                type: 'system',
                message: `You see ${character.name} take aim at ${targetPlayer.name}.`,
            }),
            meta: {
                target: `${character.location.map}_${character.location.x}_${character.location.y}`,
                ignore: [
                    character.user_id,
                    targetPlayer.user_id
                ]
            }
        },
        {
            ...newEvent({
                type: 'system',
                message: `You take aim at ${targetPlayer.name}.`,
            }),
            meta
        },
        {
            ...newEvent({
                type: 'system',
                message: `${character.name} has taken aim on you. The only way get out of this, is to kill ${character.name} or /flee <n|s|w|e>`,
            }),
            meta: {
                target: targetPlayer.user_id
            }
        }
    ]);
}