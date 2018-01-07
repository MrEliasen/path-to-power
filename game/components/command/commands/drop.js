import { clientCommandError } from '../redux/actions';
import { dropItem, serverRecordItemDrop } from '../../item/redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';
import { newEvent } from '../../socket/redux/actions';

export default function cmdDrop(socket, params, getState, resolve) {
    if (!params[0]) {
        return resolve();
    }

    const character = getState().characters.list[socket.user.user_id] || null;
    const meta = {
        socket_id: socket.id
    }
    let amount = params.pop();
    let itemName = params || [];

    // If the last parameter is not considered a number
    // assume its part of the item name, and set amount default 1
    if (!parseInt(amount)) {
        itemName.push(amount);
        amount = 1;
    }

    itemName = itemName.join(' ').toLowerCase();

    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    const grid = `${character.location.map}_${character.location.x}_${character.location.y}`;
    const itemList = getState().items.list;
    let droppedItem = character.dropItem(itemName, amount, itemList);

    if (!droppedItem) {
        return resolve([{
            ...clientCommandError('You do not have any of that item.'),
            meta
        }]);
    }

    resolve([
        updateCharacter(character),
        serverRecordItemDrop({
            stackable: droppedItem.stats.stackable,
            item: {
                id: droppedItem.id,
                durability: droppedItem.stats.durability
            },
            location: {
                map: character.location.map,
                x: character.location.x,
                y: character.location.y
            }
        }),
        {
            ...dropItem({
                id: droppedItem.id,
                durability: droppedItem.stats.durability,
                stackable: droppedItem.stats.stackable
            }),
            meta: {
                target: grid
            }
        },
        {
            ...newEvent(`Your dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`),
            meta,
        },
        {
            ...newEvent(`${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`),
            meta: {
                target: grid
            }
        },
        {
            ...updateClientCharacter(character),
            meta
        }
    ])
}