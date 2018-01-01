import { CLIENT_FETCH_MAPS, CLIENT_UPDATE_LOCATION, CLIENT_LOAD_PLAYER_MAP, CLIENT_LEAVE_GRID, CLIENT_JOIN_GRID } from './types';

export function fetchMaps(mapState) {
    const payload = {};

    Object.keys(mapState).map((mapkey) => {
        payload[mapkey] = mapState[mapkey].title;
    })

    return {
        type: CLIENT_FETCH_MAPS,
        payload
    }
}

export function updateLocation(payload) {
    return {
        type: CLIENT_UPDATE_LOCATION,
        payload
    }
}

export function loadPlayerMap(map) {
    return {
        type: CLIENT_LOAD_PLAYER_MAP,
        payload: map
    }
}

export function leaveGrid(character) {
    return {
        type: CLIENT_LEAVE_GRID,
        payload: character
    }
}

export function joinGrid(character) {
    return {
        type: CLIENT_JOIN_GRID,
        payload: character
    }
}