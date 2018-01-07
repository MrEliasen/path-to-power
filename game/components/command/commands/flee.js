import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { newEvent } from '../../socket/redux/actions';
import { joinGrid, leaveGrid, loadGrid } from '../../map/redux/actions';
import { loadLocalGrid } from '../../map';
import { dropItem, serverRecordItemDrop } from '../../item/redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';

export default function cmdFlee(socket, params, getState, resolve, dispatch) {
    const character = getState().characters.list[socket.user.user_id] || null;
    const directions = ['n','e','s','w'];
    let direction = params.join('').trim();
    let moveAction = {};
    const meta = {
        socket_id: socket.id
    }

    if (!character) {
        return resolve();
    }

    // dont allow to flee, without being gridlocked
    if (!character.gridLocked || !character.gridLocked.length) {
        return resolve([{
            ...newEvent({
                type: 'system',
                message: 'No one has taken aim at you, you can freely move.'
            }),
            meta
        }])
    }

    // if no direction is set, choose a random direction
    if (!direction || direction === '') {
        direction = directions[Math.floor(Math.random() * directions.length)];
    }

    switch (direction.toLowerCase()) {
        case 'north':
        case 'n':
            moveAction = {
                grid: 'y',
                direction: -1
            }
            break;

        case 'south':
        case 's':
            moveAction = {
                grid: 'y',
                direction: 1
            }
            break;

        case 'east':
        case 'e':
            moveAction = {
                grid: 'x',
                direction: 1
            }
            break;

        case 'west':
        case 'w':
            moveAction = {
                grid: 'x',
                direction: -1
            }
            break;
    }

    const resolveEvents = [];

    // load the current map grid
    const gameMap = getState().maps[character.location.map];
    let newLocation = gameMap.isValidNewLocation(character.location, moveAction);

    // check if they can move in the fleeing direction
    if (!newLocation) {
        // otherwise move the opporsite direction.
        moveAction.direction = (moveAction.direction === 1 ? -1 : 1);
        newLocation = gameMap.isValidNewLocation(character.location, moveAction)
    }

    // remove gridlocks from other players who where targeted by this character
    const old_location = {...character.location};
    const oldGrid = `${old_location.map}_${old_location.x}_${old_location.y}`;
    const newGrid = `${character.location.map}_${character.location.x}_${character.location.y}`;
    const characterList = getState().characters.list;

    // drop random items when fleeing, if they have any
    if (character.inventory.length) {
        const itemsCount = Math.floor(Math.random() * 3);
        const itemList = getState().items.list;

        for (var i = itemsCount; i >= 0; i--) {
            let droppedItem = character.dropRandomItem(itemList);

            if (droppedItem) { 
                // record the dropped item (store in the redux store)
                dispatch(serverRecordItemDrop({
                    stackable: droppedItem.stats.stackable,
                    item: {
                        id: droppedItem.id,
                        durability: droppedItem.stats.durability
                    },
                    location: {
                        map: old_location.map,
                        x: old_location.x,
                        y: old_location.y
                    }
                }));

                // dispatch the item drop to the client
                dispatch({
                    ...dropItem({
                        id: droppedItem.id,
                        durability: droppedItem.stats.durability,
                        stackable: droppedItem.stats.stackable
                    }),
                    meta: {
                        target: oldGrid
                    }
                });
            }
        }
    }

    // update the character location
    character.location.x = newLocation.x;
    character.location.y = newLocation.y;
    character.gridLocked = [];

    // dispatch character update to store
    dispatch(updateCharacter(character))

    // load the old grid inforamtion, so we can loop through all players in the grid, releasing them from gridlock, if they have been locked by the player
    const oldMapGrid = loadLocalGrid(getState, old_location);
    oldMapGrid
        .then((gridData) => {
            Object.keys(gridData.players).map((user_id) => {
                let target = characterList[user_id];

                if (target.gridRelease(character.user_id)) {
                    dispatch(updateCharacter(target))
                }
            })
        })
        .catch(console.log);

    // load the new grid information for the client
    const newMapGrid = loadLocalGrid(getState, character.location);
    newMapGrid
        .then((gridData) => {
            // dispatch a broadcast to old grid
            socket.leave(oldGrid)
            dispatch({
                ...leaveGrid({user_id: character.user_id, name: character.name, location: old_location }),
                subtype: SERVER_TO_CLIENT,
                meta: {
                    target: oldGrid
                }
            })
            // load the grid data
            dispatch({
                ...loadGrid(gridData),
                subtype: SERVER_TO_CLIENT,
                meta
            })
            // dispatch a broadcast to the new grid
            dispatch({
                ...joinGrid({user_id: character.user_id, name: character.name, location: character.location }),
                subtype: SERVER_TO_CLIENT,
                meta: {
                    target: newGrid
                }
            })
            socket.join(newGrid)

            // dispatch players in current grid
            dispatch({
                ...updateClientCharacter(character),
                subtype: SERVER_TO_CLIENT,
                meta
            })

            // let the old grid know, the character has fled the area
            dispatch({
                ...newEvent({
                    type: 'system',
                    message: `${character.name} fled the area, dropping some items as they ran away.`
                }),
                subtype: SERVER_TO_CLIENT,
                meta: {
                    target: oldGrid
                }
            })

            resolve();
        })
        .catch(console.log)
}