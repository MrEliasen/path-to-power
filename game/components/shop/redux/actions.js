import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { CLIENT_LOAD_SHOP } from './types';
import { clientCommandError } from '../../commands/redux/actions';

export function loadShop(socket, params, getState, resolve) {
    const meta = {
        socket_id: socket.id
    }
    // load character and shops list
    const character = getState().characters.list[socket.user.user_id];

    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    // load required game details
    const gameMap = getState().maps[character.location.map];
    const shopsList = getState().shops;
    const actions = gameMap.grid[character.location.y][character.location.x].actions;

    // check if the shop command is available at the given grid
    if (!Object.keys(actions).includes('/shop')) {
        return resolve([{
            ...clientCommandError('There is no shop here.'),
            meta
        }]);
    }

    // load the shop at the grid
    const shop = shopsList[actions['/shop'].shop];

    resolve([{
        type: CLIENT_LOAD_SHOP,
        subtype: SERVER_TO_CLIENT,
        payload: shop,
        meta
    }])
}