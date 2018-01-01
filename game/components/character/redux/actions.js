import {
    CHARACTER_ADD,
    CHARACTER_REMOVE,
    CLIENT_LOAD_CHARACTER,
    CLIENT_CHARACTER_CREATED,
    CLIENT_ADD_TO_PLAYERLIST,
    CLIENT_REMOVE_FROM_PLAYERLIST,
    CLIENT_LOAD_PLAYERLIST,
    CLIENT_UPDATE_CHARACTER,
    CHARACTER_UPDATE } from './types';
import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { createNotification } from '../../socket/redux/actions';
import { joinGrid, leaveGrid, loadGrid } from '../../map/redux/actions';
import { create, loadFromDb } from '../db/controller';
import Character from '../index';

export function addOnlineCharacter(character) {
    return {
        type: CHARACTER_ADD,
        payload: new Character(character)
    }
}

export function removeOnlineCharacter(character) {
    return {
        type: CHARACTER_REMOVE,
        payload: character
    }
}

export function fetchCharacter(character) {
    return {
        type: CLIENT_LOAD_CHARACTER,
        payload: character
    }
}

export function fetchOnlineCharacters(characterList) {
    return {
        type: CLIENT_LOAD_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: characterList
    }
}

export function broadcastOnlineCharacter(character) {
    return {
        type: CLIENT_ADD_TO_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: {
            user_id: character.user_id,
            name: character.name
        }
    }
}

export function broadcastOfflineCharacter(character) {
    return {
        type: CLIENT_REMOVE_FROM_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: {
            user_id: character.user_id,
            name: character.name
        }
    }
}

export function updateClientCharacter(character) {
    return {
        type: CLIENT_UPDATE_CHARACTER,
        subtype: SERVER_TO_CLIENT,
        payload: character
    }
}

export function moveCharacter(action, socket) {
    return (dispatch, getState, io) => {
        return new Promise((resolve, reject) => {
            // fetch the character
            const character = getState().characters.list[socket.user.user_id];

            if (!character) {
                return resolve();
            }

            // fetch the character
            const locationMap = getState().maps[character.location.map];

            if (!locationMap) {
                return resolve();
            }

            // check the new location is valid
            const old_location = {...character.location};
            const validMove = locationMap.isValidNewLocation(character.location, action.payload);

            if (!validMove) {
                return resolve();
            }

            // update the character location
            character.location.x = validMove.x;
            character.location.y = validMove.y;

            // dispatch character update to store
            dispatch({
                type: CHARACTER_UPDATE,
                payload: character
            })

            // dispatch a broadcast to the new grid
            const oldGrid = `${old_location.map}_${old_location.x}_${old_location.y}`;
            const grid = `${character.location.map}_${character.location.x}_${character.location.y}`;
            const load = new Promise((resolve, reject) => {
                const location = getState().characters.locations;
                if (location) {
                    if (location[character.location.map]) {
                        if (location[character.location.map][character.location.y]) {
                            if (location[character.location.map][character.location.y][character.location.x]) {
                                return resolve(location[character.location.map][character.location.y][character.location.x]);
                            }
                        }
                    }
                }

                resolve({})
            })

            load.then((players) => {
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
                    ...loadGrid(players),
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta
                })
                // dispatch a broadcast to the new grid
                dispatch({
                    ...joinGrid({user_id: character.user_id, name: character.name, location: character.location }),
                    subtype: SERVER_TO_CLIENT,
                    meta: {
                        target: grid
                    }
                })
                socket.join(grid)

                // dispatch players in current grid
                dispatch({
                    ...updateClientCharacter(character),
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta
                })
            })
            .catch(console.log)
        })
    }
}

export function createCharacter(action, socket) {
    return (dispatch, getState, io) => {
        const cities = getState().maps;

        return new Promise((resolve, reject) => {
            create(socket.user.user_id, action, cities, (error, character) => {
                if (error) {
                    return dispatch(createNotification(error.type, error.message, error.title))
                }

                // convery mongodb obj to plain obj
                character = character.toObject();    
                socket.user.name = character.name;            

                // send character information to socket
                dispatch({
                    ...fetchCharacter(character),
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta
                });

                // set the player in the online player list (server)
                dispatch(addOnlineCharacter(character))
                // announce a player is online
                dispatch(broadcastOnlineCharacter(character));
                // fetch all online players, dispatch to socket
                dispatch({
                    ...fetchOnlineCharacters(getState().characters.online),
                    meta: action.meta
                })

                // dispatch the character back to the client
                dispatch({
                    type: CLIENT_CHARACTER_CREATED,
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta,
                    payload: character
                })

                const grid = `${character.location.map}_${character.location.x}_${character.location.y}`;
                const load = new Promise((resolve, reject) => {
                    const location = getState().characters.locations;
                    if (location) {
                        if (location[character.location.map]) {
                            if (location[character.location.map][character.location.y]) {
                                if (location[character.location.map][character.location.y][character.location.x]) {
                                    return resolve(location[character.location.map][character.location.y][character.location.x]);
                                }
                            }
                        }
                    }

                    resolve({})
                })

                load.then((players) => {
                    dispatch({
                        ...loadGrid(players),
                        subtype: SERVER_TO_CLIENT,
                        meta: action.meta
                    })
                    // dispatch a broadcast to the new grid
                    dispatch({
                        ...joinGrid({user_id: character.user_id, name: character.name, location: character.location }),
                        subtype: SERVER_TO_CLIENT,
                        meta: {
                            target: grid
                        }
                    })
                    socket.join(grid)
                })
                .catch(console.log)
            })
        })
    }
}

