import { clientCommandError } from '../redux/actions';
import { newEvent } from '../../socket/redux/actions';
import { loadLocalGrid } from '../../map';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';

export default function cmdRelease(socket, params, getState, resolve) {
    // fetch the client, create the target to search for and set the meta for default socket returns.
    const character = getState().characters.list[socket.user.user_id] || null;
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
    const playerGrid = loadLocalGrid(getState, character.location);
    const characterList = getState().characters.list;
    const actions = [];

    // load the grid inforamtion, so we can loop through all players in the grid, releasing them from gridlock if they have been locked by the player;
    playerGrid
        .then((gridData) => {
            Object.keys(gridData.players).map((user_id) => {
                let target = characterList[user_id];

                // release the target from gridlock
                if (target.gridRelease(character.user_id)) {
                    // update the target character in the redux store
                    actions.push(updateCharacter(target));
                    // let the target know they where released
                    actions.push({
                        ...newEvent({
                            type: 'system',
                            message: `${character.name} releases you from their aim.`,
                        }),
                        meta: {
                            target: target.user_id
                        }
                    });
                    // let the client know, they are no longer aiming at the target
                    actions.push({
                        ...newEvent({
                            type: 'system',
                            message: `You no longer have ${target.name} as your target.`,
                        }),
                        meta
                    });
                }
            })
        })
        .catch(console.log);

    // send event messages to the grid.
    return resolve(actions);
}