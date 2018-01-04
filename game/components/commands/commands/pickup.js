import { clientCommandError } from '../redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';
import { newEvent } from '../../socket/redux/actions';
import { pickupItem, serverRecordItemPickup } from '../../item/redux/actions';

export default function cmdPickup(socket, params, getState, resolve) {
    if (!params[0]) {
        return resolve();
    }

    const character = getState().characters.list[socket.user.user_id] || null;
    const meta = {
        socket_id: socket.id
    }
    let amount = params.pop();
    let needle = params || [];

    // If the last parameter is not considered a number
    // assume its part of the item name, and set amount default 1
    if (!parseInt(amount)) {
        needle.push(amount);
        amount = 1;
    }

    needle = needle.join(' ').toLowerCase();

    // if the character is not found, tell them to relog
    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    const grid = `${character.location.map}_${character.location.x}_${character.location.y}`;
    const itemList = getState().items.list;
    const localItems = getState().items.locations;

    // make sure there where even items in this grid once.
    if (!localItems[character.location.map]) {
        return resolve([{
            ...clientCommandError('There are no items on the ground.'),
            meta
        }]);
    }
    if (!localItems[character.location.map][character.location.y]) {
        return resolve([{
            ...clientCommandError('There are no items on the ground.'),
            meta
        }]);
    }
    if (!localItems[character.location.map][character.location.y][character.location.x]) {
        return resolve([{
            ...clientCommandError('There are no items on the ground.'),
            meta
        }]);
    }

    // search for the item in the grid
    const localItemList = [...localItems[character.location.map][character.location.y][character.location.x]];
    const total = localItemList.length;
    let itemIndex;
    let removeFromItems = false;
    let pickedUpItem;

    for (var i = 0; i < total; i++) {
        if (itemList[localItemList[i].id].name.toLowerCase().indexOf(needle) === 0) {
            itemIndex = i;
            break;
        }
    }

    if (!itemIndex && itemIndex !== 0) {
        return resolve([{
            ...clientCommandError('That item does not appear to be on the ground.'),
            meta
        }]);
    }

    // if the item is non-stackable, just pick it up
    if (!itemList[localItemList[itemIndex].id].stats.stackable) {
        // bind the item to the variable, while recoming it from the array.
        pickedUpItem = itemList[localItemList.splice(itemIndex, 1)[0].id];
        removeFromItems = true;
    } else {
        // make sure the item has emough to pick up
        if (localItemList[itemIndex].durability < amount) {
            return resolve([{
                ...clientCommandError(`There is not enough. You see only ${localItemList[itemIndex].durability}`),
                meta
            }]);
        }

        pickedUpItem = itemList[localItemList[itemIndex].id]
        pickedUpItem.setDurability(amount);

        // redume amount of local item 
        localItemList[itemIndex].durability = localItemList[itemIndex].durability - amount;
        // remove if it now has 0 or less durability
        if (localItemList[itemIndex].durability <= 0) {
            removeFromItems = true;
            localItemList.splice(itemIndex, 1);
        }
    }

    // give the item of the specified type to the character
    character.giveItem(pickedUpItem, amount);

    resolve([
        updateCharacter(character),
        serverRecordItemPickup({
            item: {
                index: itemIndex,
                durability: (!removeFromItems ? localItemList[itemIndex].durability : 0),
                remove: removeFromItems
            },
            location: {
                map: character.location.map,
                x: character.location.x,
                y: character.location.y
            }
        }),
        {
            ...pickupItem({
                index: itemIndex,
                amount: amount,
                remove: removeFromItems
            }),
            meta: {
                target: grid
            }
        },
        {
            ...newEvent(`Your picked up ${(pickedUpItem.stats.stackable ? 'a' : `${amount}x`)} ${pickedUpItem.name} from the ground`),
            meta,
        },
        {
            ...newEvent(`${character.name} picked up ${(pickedUpItem.stats.stackable ? 'a' : `${amount}x`)} ${pickedUpItem.name} from the ground`),
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