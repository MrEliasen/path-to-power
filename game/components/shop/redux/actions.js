import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { CLIENT_LOAD_SHOP, SHOP_UPDATE, CLIENT_UPDATE_SHOP, SHOP_NOTIFICATION } from './types';
import { clientCommandError } from '../../commands/redux/actions';
import { updateCharacter, updateClientCharacter } from '../../character/redux/actions';

export function updateClientShop(shopId, inventory) {
    return {
        type: CLIENT_UPDATE_SHOP,
        subtype: SERVER_TO_CLIENT,
        payload: {
            shop: shopId,
            inventory
        }
    }
}

export function updateShop(shopId, inventory) {
    return {
        type: SHOP_UPDATE,
        payload: {
            shop: shopId,
            inventory
        }
    }
}

export function shopNotification(shopId, messageData) {
    return {
        type: SHOP_NOTIFICATION,
        subtype: SERVER_TO_CLIENT,
        payload: {
            shop: shopId,
            ...messageData
        }
    }
}

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

function resolve(argument) {
    console.log(argument);
}

export function shopPurchase(action, socket) {
    return (dispatch, getState, io) => {
        // TODO allow to buy more than one at the same time.
        const amount = 1;
        // the default client response meta (target client only)
        const meta = {
            socket_id: socket.id
        }

        // check if the request has the bits of information we need
        if (!action.payload.shop || !action.payload.item) {
            return dispatch({
                ...clientCommandError('Invalid request.'),
                meta
            });
        }

        // if the character does not exist, end the request
        const character = getState().characters.list[socket.user.user_id] || null;

        if (!character) {
            return dispatch({
                ...clientCommandError('Character not found, please log out and in again.'),
                meta
            });
        }

        // check the player location exists
        const grid = getState().maps[character.location.map].grid;

        if (!grid[character.location.y]) {
            return dispatch({
                ...clientCommandError('Invalid character location'),
                meta
            });
        }
        if (!grid[character.location.y][character.location.x]) {
            return dispatch({
                ...clientCommandError('Invalid character location'),
                meta
            });
        }

        // Check if the player is at the given shop
        if (!grid[character.location.y][character.location.x].actions['/shop']) {
            return dispatch({
                ...clientCommandError('There is no shop here.'),
                meta
            });
        }
        if (!grid[character.location.y][character.location.x].actions['/shop'].shop === action.payload.shop) {
            return dispatch({
                ...clientCommandError('There is no shop of that type here.'),
                meta
            });
        }

        // Check the shop is carrying the selected item
        const shop = {...getState().shops[action.payload.shop]};
        const totalItems = shop.selling.length;
        let itemIndex = -1;
        let listItem;

        for (var i = 0; i < totalItems; i++) {
            if (shop.selling[i].id === action.payload.item) {
                itemIndex = i;
                listItem = shop.selling[i];
                break;
            }
        }

        if (itemIndex === -1) {
            return dispatch({
                ...shopNotification(shop.id, {type: 'error', message: 'That item no longer appears to be for sale.'}),
                meta
            });
        }

        // check player has enough money to buy the item
        const item = getState().items.list[listItem.id];

        if (character.stats.money < item.stats.price) {
            return dispatch({
                ...shopNotification(shop.id, {type: 'error', message: 'You do not have enough money to buy this item.'}),
                meta
            });
        }

        // TODO check if player has inventory space

        // give the item to the character
        character.giveItem(item, 1);
        character.stats.money = character.stats.money - item.stats.price;

        // if the item is not unlimited, and if the item quantity reaches 0
        // after the purchase remove the item
        if (listItem.quantity < 999) {
            if (listItem.quantity - amount <= 0) {
                shop.selling.splice(itemIndex, 1);
            } else {
                shop.selling[itemIndex].quantity = shop.selling[itemIndex].quantity - amount;
            }
        }

        dispatch(updateCharacter(character));
        dispatch(updateShop(shop.id, shop.selling));
        dispatch({
            ...updateClientCharacter(character),
            meta: {
                socket_id: socket.id
            }
        })
        dispatch({
            ...shopNotification(shop.id, {type: 'success', message: `You bought ${amount}x ${item.name}, for ${item.stats.price * amount}`}),
            meta
        })

        // no need to send the shop inventory update to clients, if the item is unlimited.
        if (listItem.quantity < 999) {
            dispatch({
                ...updateClientShop(shop.id, shop.selling),
                meta: {
                    target: `${character.location.map}_${character.location.x}_${character.location.y}`
                }
            });
        }
    }
}