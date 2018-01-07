import { clientCommandError } from '../redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';
import { newEvent } from '../../socket/redux/actions';

export default function cmdGive(socket, params, getState, resolve) {
    if (!params[0]) {
        return resolve();
    }

    const itemKey = params[0];
    const amount = parseInt(params[1]) || 1;
    const character = getState().characters.list[socket.user.user_id] || null;
    const item = getState().items.list[itemKey];
    const meta = {
        socket_id: socket.id
    }

    if (!character) {
        return callback([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    if (!item) {
        return resolve([{
            ...clientCommandError('Invalid items.'),
            meta
        }]);
    }

    character.giveItem(item, amount);

    return resolve([
        updateCharacter(character),
        {
            ...newEvent(`Your received ${amount}x ${item.name}`),
            meta,
        },
        {
            ...updateClientCharacter(character),
            meta
        }
    ])
}