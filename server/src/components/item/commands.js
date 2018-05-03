import {ITEM_GROUND_ITEMS} from 'shared/actionTypes';

/**
 * Drop an item in a specific inventory slot
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdDropSlot(socket, character, command, params, cmdObject, Game) {
    let slotId = params[0];

    // drop the item from the inventory, should it exist
    let droppedItem = character.dropSlotItem(slotId);

    if (!droppedItem) {
        return Game.eventToSocket(socket, 'error', 'You do not have any items in this inventory slot.');
    }

    // add the item to the grid location
    const items_list = Game.itemManager.drop(character.location.map, character.location.x, character.location.y, droppedItem);

    // holds the items data we will send to the rooms
    const items_ground = items_list.map((obj) => {
        return {
            id: obj.id,
            ...obj.getModifiers(),
        };
    });

    // update the clients character informatiom
    Game.characterManager.updateClient(character.user_id, 'inventory');

    // send the updated items list to the grid
    Game.socketManager.dispatchToRoom(character.getLocationId(), {
        type: ITEM_GROUND_ITEMS,
        payload: items_ground,
    });

    // dispatch events to the user
    Game.eventToSocket(socket, 'info', `You dropped ${(!droppedItem.stats.stackable ? 'a' : `${droppedItem.stats.durability}x`)} ${droppedItem.name} on the ground`);
    // dispatch events to the grid
    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(!droppedItem.stats.stackable ? 'a' : `${droppedItem.stats.durability}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
}

/**
 * Drop item command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdDrop(socket, character, command, params, cmdObject, Game) {
    let item = params[0];
    let amount = params[1] || 1;

    // drop the item from the inventory, should it exist
    let droppedItem = character.dropItem(item.name, amount);

    if (!droppedItem) {
        return Game.eventToSocket(socket, 'error', `You do not have any ${item.name} in your inventory.`);
    }

    // if the item was non-stackable, set amount to 1
    if (!droppedItem.stats.stackable) {
        amount = 1;
    }

    // add the item to the grid location
    const items_list = Game.itemManager.drop(character.location.map, character.location.x, character.location.y, droppedItem);
    // holds the items data we will send to the rooms
    const items_ground = items_list.map((obj) => {
        return {
            id: obj.id,
            ...obj.getModifiers(),
        };
    });

    // update the clients character informatiom
    Game.characterManager.updateClient(character.user_id, 'inventory');

    // send the updated items list to the grid
    Game.socketManager.dispatchToRoom(character.getLocationId(), {
        type: ITEM_GROUND_ITEMS,
        payload: items_ground,
    });

    // dispatch events to the user
    Game.eventToSocket(socket, 'info', `You dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`);
    // dispatch events to the grid
    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
}

/**
 * Drop item by index command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdDropByIndex(socket, character, command, params, cmdObject, Game) {
    let itemIndex = params[0];
    let amount = params[1] || 1;

    // drop the item from the inventory, should it exist
    let droppedItem = character.dropItem(itemIndex, amount);

    if (!droppedItem) {
        return;
    }

    // add the item to the grid location
    const items_list = Game.itemManager.drop(character.location.map, character.location.x, character.location.y, droppedItem);
    // holds the items data we will send to the rooms
    const items_ground = items_list.map((obj) => {
        return {
            id: obj.id,
            ...obj.getModifiers(),
        };
    });

    // update the clients character informatiom
    Game.characterManager.updateClient(character.user_id, 'inventory');

    // send the updated items list to the grid
    Game.socketManager.dispatchToRoom(character.getLocationId(), {
        type: ITEM_GROUND_ITEMS,
        payload: items_ground,
    });

    // dispatch events to the user
    Game.eventToSocket(socket, 'info', `You dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`);
    // dispatch events to the grid
    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
}

/**
 * Give item command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdGiveItem(socket, character, command, params, cmdObject, Game) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    const amount = params[1] || 1;
    const item = Game.itemManager.add(params[0].id);

    // make sure the character has room
    if (!character.hasRoomForItem(item, amount)) {
        return Game.eventToSocket(socket, 'error', `You do not have enough inventory space for ${amount}x of that item.`);
    }

    character.giveItem(item, amount);
    Game.eventToSocket(socket, 'info', `You received ${amount}x ${item.name}`);
    Game.characterManager.updateClient(socket.user.user_id, 'inventory');
}

/**
 * Item pickup command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdPickup(socket, character, command, params, cmdObject, Game) {
    let item = params[0];
    let amount = params[1] || 1;
    const location = [
        character.location.map,
        character.location.x,
        character.location.y,
    ];

    // get the item from the ground
    const itemObject = Game.itemManager.pickup(...location, item.name, amount);

    if (typeof itemObject === 'string') {
        return Game.eventToUser(user_id, 'error', itemObject);
    }

    // make sure the character has room
    if (!character.hasRoomForItem(itemObject)) {
        return Game.eventToUser(user_id, 'error', 'You do not have enough inventory space to pickup that item.');
    }

    // add to user inventory
    character.giveItem(itemObject);
    // update the character details, client side
    Game.characterManager.updateClient(character.user_id);
    // update the grid item list for the clients
    Game.socketManager.dispatchToRoom(character.getLocationId(), {
        type: ITEM_GROUND_ITEMS,
        payload: Game.itemManager.getLocationList(...location, true),
    });

    // send pickup event to the client
    Game.eventToSocket(socket, 'info', `You picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`);
    // send pickup event to the grid
    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`, [character.user_id]);
}

/**
 * Item use command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdUseItem(socket, character, command, params, cmdObject, Game) {
    const invSlot = params[0];
    const item = character.getEquipped(invSlot);

    if (!item) {
        return;
    }

    item.use(character);
}

module.exports = [
    {
        command: '/useslot',
        aliases: [],
        params: [
            {
                name: 'Slot-ID',
                desc: 'The inventory slot containing the item to use',
                rules: 'required|slot',
            },
        ],
        description: 'use an inventory item, based on the item\'s inventory index.',
        method: cmdUseItem,
    },
    {
        command: '/drop',
        aliases: [],
        params: [
            {
                name: 'Item Name',
                desc: 'The name of the item in your inventory to drop.',
                rules: 'required|item:name',
            },
            {
                name: 'Amount',
                desc: 'The amount of an item to drop (stackable items only).',
                rules: 'integer|min:1',
            },
        ],
        description: 'Drop an item on the ground.',
        method: cmdDrop,
    },
    {
        command: '/dropslot',
        aliases: [],
        params: [
            {
                name: 'Inventory Slot',
                desc: 'The name of the inventory slot which has the item you want to drop on the ground.',
                rules: 'required|slot',
            },
        ],
        description: 'Drop an item on the ground.',
        method: cmdDropSlot,
    },
    {
        command: '/pickup',
        aliases: [
            '/get',
        ],
        params: [
            {
                name: 'Item Name',
                desc: 'The name of the item you want to pick up',
                rules: 'item:name',
            },
            {
                name: 'Amount',
                desc: 'The number of items of the speicfied kind you want to pick up.',
                rules: 'integer|min:1',
            },
        ],
        description: 'Pickup an item from the ground. If the name is omitted, the first item will be picked up.',
        method: cmdPickup,
    },
    {
        command: '/giveitem',
        aliases: [],
        params: [
            {
                name: 'Item ID',
                desc: 'The item ID of the item you wish to give yourself.',
                rules: 'required|item:id',
            },
            {
                name: 'Amount',
                desc: 'The amount of a given item to receive.',
                rules: 'integer|min:1',
            },
        ],
        description: 'Gives an item to the player.',
        method: cmdGiveItem,
    },
];
