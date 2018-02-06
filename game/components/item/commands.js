import { UPDATE_GROUND_ITEMS } from './types';

function cmdDrop(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            let amount = params.pop();
            let item_name = params || [];

            // If the last parameter is not considered a number
            // assume its part of the item name, and set amount default 1
            if (!parseInt(amount, 10)) {
                item_name.push(amount);
                amount = 1;
            }

            // the finished item name we will look for
            item_name = item_name.join(' ').toLowerCase();
        
            // drop the item from the inventory, should it exist
            let droppedItem = character.dropItem(item_name, amount);

            if (!droppedItem) {
                return Game.eventToSocket(socket, 'error', `You do not have any items, which name begins with ${item_name}.`);
            }

            // add the item to the grid location
            const items_list = Game.itemManager.drop(character.location.map, character.location.x, character.location.y, droppedItem);
            // holds the items data we will send to the rooms
            const items_ground = items_list.map((obj) => {
                return {
                    id: obj.id,
                    ...obj.getModifiers()
                }
            });

            // update the clients character informatiom
            Game.characterManager.updateClient(character.user_id, 'inventory');
            // send the updated items list to the grid
            Game.socketManager.dispatchToRoom(character.getLocationId(), {
                type: UPDATE_GROUND_ITEMS,
                payload: items_ground
            })

            // dispatch events to the user
            Game.eventToSocket(socket, 'info', `You dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`);
            // dispatch events to the grid
            Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
        })
}

function cmdDropByIndex(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            let amount = params.pop();
            let itemIndex = params || [];

            // If the last parameter is not considered a number
            // assume its part of the item name, and set amount default 1
            if (!parseInt(amount, 10)) {
                itemIndex.push(amount);
                amount = 1;
            }

            // the finished item name we will look for
            itemIndex = parseInt(itemIndex.join(''));

            if (isNaN(itemIndex) || itemIndex < 0) {
                return;
            }
        
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
                    ...obj.getModifiers()
                }
            });

            // update the clients character informatiom
            Game.characterManager.updateClient(character.user_id, 'inventory');
            // send the updated items list to the grid
            Game.socketManager.dispatchToRoom(character.getLocationId(), {
                type: UPDATE_GROUND_ITEMS,
                payload: items_ground
            })

            // dispatch events to the user
            Game.eventToSocket(socket, 'info', `You dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`);
            // dispatch events to the grid
            Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
        })
}

function cmdGiveItem(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    const itemKey = params[0];
    const amount = parseInt(params[1], 10) || 1;
    const itemTemplate = Game.itemManager.getTemplate(itemKey);

    if (!itemTemplate) {
        return Game.eventToSocket(socket, 'error',  'Invalid item.');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const item = Game.itemManager.add(itemTemplate.id);

            // make sure the character has room
            if (!character.hasRoomForItem(item, amount)) {
                return Game.eventToSocket(socket, 'error', `You do not have enough inventory space for ${amount}x of that item.`);
            }

            character.giveItem(item, amount);
            Game.eventToSocket(socket, 'info',  `You received ${amount}x ${item.name}`);
            Game.characterManager.updateClient(socket.user.user_id, 'inventory');
        })
        .catch((error) => {
            Game.eventToSocket(socket, 'error',  'Invalid character. Please logout and back in.')
        });
}

function cmdPickup(socket, command, params, Game) {
    // get the character
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const location = [
                character.location.map,
                character.location.x,
                character.location.y
            ];
            const locationItems = Game.itemManager.getLocationList(...location);
            let amount = params.pop();
            let itemName = params || [];

            // If the last parameter is not considered a number
            // assume its part of the item name, and set amount default 1
            if (!parseInt(amount, 10)) {
                itemName.push(amount);
                amount = 1;
            }

            itemName = itemName.join(' ').toLowerCase();

            // get the item from the ground
            Game.itemManager.pickup(...location, itemName, amount)
                .then((itemObject) => {
                    // make sure the character has room
                    if (!character.hasRoomForItem(itemObject)) {
                        return this.Game.eventToUser(user_id, 'error', 'You do not have enough inventory space to pickup that item.');
                    }

                    // add to user inventory
                    character.giveItem(itemObject);
                    // update the character details, client side
                    Game.characterManager.updateClient(character.user_id);
                    // update the grid item list for the clients
                    Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: UPDATE_GROUND_ITEMS,
                        payload: Game.itemManager.getLocationList(...location, true)
                    });

                    // send pickup event to the client
                    Game.eventToSocket(socket, 'info', `You picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`);
                    // send pickup event to the grid
                    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`, [character.user_id]);

                })
                .catch((error) => {
                    Game.eventToSocket(socket, 'error', 'There are no items on the ground, matching that name.');
                })
        })
        .catch((err) => {
            Game.logger.debug(err);
        });
}

function cmdUseItem(socket, command, params, Game) {
    // get the character
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const index = parseInt(params[0], 10);

            // Validate the index is a number
            if (isNaN(index) || index < 0) {
                return;
            }

            const item = character.inventory[index];

            // make sure the item exists
            if (!item) {
                return;
            }

            item.use(character);
        })
        .catch(() => {

        });
}

module.exports = [
    {
        commandKeys: [
            '/usebyindex'
        ],
        method: cmdUseItem
    },
    {
        commandKeys: [
            '/drop'
        ],
        method: cmdDrop
    },
    {
        commandKeys: [
            '/dropbyindex'
        ],
        method: cmdDropByIndex
    },
    {
        commandKeys: [
            '/pickup',
            '/get'
        ],
        method: cmdPickup
    },/*
    {
        commandKeys: [
            '/giveitem'
        ],
        method: cmdGiveItem
    },*/
];