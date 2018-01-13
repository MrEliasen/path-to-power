import { UPDATE_GROUND_ITEMS } from '../../item/types';

export default function cmdDrop(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            let amount = params.pop();
            let item_name = params || [];

            // If the last parameter is not considered a number
            // assume its part of the item name, and set amount default 1
            if (!parseInt(amount)) {
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

            // FIXME: Stackable items, reference inventory items once dropped.

            // add the item to the grid location
            const items_list = Game.itemManager.drop(character.location.map, character.location.x, character.location.y, droppedItem);
            // holds the items data we will send to the rooms
            const items_ground = items_list.map((obj) => {
                return {
                    id: obj.id,
                    ...obj.getModifiers(),
                    fingerprint: obj.fingerprint
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
            Game.eventToSocket(socket, 'info', `Your dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`);
            // dispatch events to the grid
            Game.eventToRoom(character.getLocationId(), 'info', `${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`, [character.user_id]);
        })
}