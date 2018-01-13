import { UPDATE_GROUND_ITEMS } from '../../item/types';

export default function cmdPickup(socket, command, params, Game) {
    if (!params[0]) {
        return;
    } 

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
            if (!parseInt(amount)) {
                itemName.push(amount);
                amount = 1;
            }

            itemName = itemName.join(' ').toLowerCase();

            // get the item from the ground
            Game.itemManager.pickup(...location, itemName, amount)
                .then((itemObject) => {
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
                    Game.eventToSocket(socket, 'info', `Your picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`);
                    // send pickup event to the grid
                    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} picked up ${(!itemObject.stats.stackable ? 'a' : `${itemObject.stats.durability}x`)} ${itemObject.name} from the ground`, [character.user_id]);

                })
                .catch((error) => {
                    Game.eventToSocket(socket, 'error', 'There are no items on the ground, matching that name.');
                })
        })
        .catch(Game.logger.debug)
}