import { SERVER_LOAD_ITEM, SERVER_DROP_ITEM, SERVER_PICKUP_ITEM } from './types';

const defaultState = {
    list: {},
    locations: {}
}

export default function(state = defaultState, action) {
    let list;
    let grid;
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
            grid = action.payload.location;
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

        case SERVER_PICKUP_ITEM:
            grid = action.payload.location;
            locations = {...state.locations};

            if (locations[grid.map]) {
                if (locations[grid.map][grid.y]) {
                    if (locations[grid.map][grid.y][grid.x]) {
                        if (action.payload.item.remove) {
                            locations[grid.map][grid.y][grid.x].splice(action.payload.item.index, 1);
                        } else {
                            locations[grid.map][grid.y][grid.x][action.payload.item.index].durability = action.payload.item.durability;
                        }
                    }
                }
            }

            return {
                ...state,
                locations
            };
    }

    return state;
}