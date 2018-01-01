import { SERVER_LOAD_ITEM, SERVER_DROP_ITEM } from './types';

const defaultState = {
    list: {},
    locations: {}
}

export default function(state = defaultState, action) {
    let list;
    let locations;

    switch (action.type) {
        case SERVER_LOAD_ITEM:
            list = {...state.list};
            list[action.payload.id] = action.payload;
            return {
                ...state,
                list
            };

        case SERVER_DROP_ITEM:
            locations = {...state.locations};

            if (!locations[action.payload.location.map]) {
                locations[action.payload.location.map] = {};
            }
            if (!locations[action.payload.location.map][action.payload.location.y]) {
                locations[action.payload.location.map][action.payload.location.y] = {};
            }
            if (!locations[action.payload.location.map][action.payload.location.y][action.payload.location.x]) {
                locations[action.payload.location.map][action.payload.location.y][action.payload.location.x] = [];
            }

            locations[action.payload.location.map][action.payload.location.y][action.payload.location.x].push(action.payload.item);

            return {
                ...state,
                locations
            };

        /*case SERVER_PICKUP_ITEM:
            locations = {...state.locations};

            if (locations[action.payload.location.map]) {
                if (locations[action.payload.location.map][action.payload.location.y]) {
                    if (locations[action.payload.location.map][action.payload.location.y][action.payload.location.x]) {

                    }
                }
            }

            return {
                ...state,
                locations
            };*/
    }

    return state;
}