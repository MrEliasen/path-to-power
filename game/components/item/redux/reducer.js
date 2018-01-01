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
            let grid = action.payload.location;
            locations = {...state.locations};

            if (!locations[grid.map]) {
                locations[grid.map] = {};
            }
            if (!locations[grid.map][grid.y]) {
                locations[grid.map][grid.y] = {};
            }
            if (!locations[grid.map][grid.y][grid.x]) {
                locations[grid.map][grid.y][grid.x] = [];
            }

            if (action.payload.stackable) {
                let stacked = false;
                locations[grid.map][grid.y][grid.x].map((item, index) => {
                    if (item.id === action.payload.item.id) {
                        stacked = true;
                        locations[grid.map][grid.y][grid.x][index].durability += action.payload.item.durability;
                    }
                })

                if (!stacked) {
                    locations[grid.map][grid.y][grid.x].push(action.payload.item);
                }
            } else {
                locations[grid.map][grid.y][grid.x].push(action.payload.item);
            }

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