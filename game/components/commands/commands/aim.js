import { clientCommandError } from '../redux/actions';
import { newEvent } from '../../socket/redux/actions';

export default function cmdAim(socket, params, getState) {
    const character = getState().characters.list[socket.user.user_id] || null;
    const target = params.join(' ').trim().toLowerCase();
    const meta = {
        socket_id: socket.id
    }

    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character, please logout and back in to resolve.'),
            meta
        }]);
    }

    if (!target) {
        return resolve([{
            ...clientCommandError('Invalid target.'),
            meta
        }]);
    }

    // get the locations of players
    const playerLocations = getState().characters.locations;

    // make sure the grid is defined
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
    const playerId = playerGrid.keys().find((playerId) => playerGrid[playerId].toLowerCase().indexOf(target) !== -1);

    if (!playerId) {
        return resolve([{
            ...clientCommandError('You look around, but you see no one with that name.'),
            meta
        }]);
    }

    // fetch the target player object
    const targetPlayer = getState().characters.list[playerId];

    // TODO Add method for applying effects to players
    // apply the "grid-lock" active effect to the character
    targetPlayer.gridLock()

    // TODO target grid for events, but exlude specific socket.
    // send event messages to the grid.
    return [{
        ...newEvent({
            type: 'local',
            name: socket.user.name,
            message: message
        }),
        meta: {
            target: `${character.location.map}_${character.location.x}_${character.location.y}`
        } 
    }];
}