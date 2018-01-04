import { newEvent } from '../socket/redux/actions';

export default function cmdSay(socket, params, getState) {
    const character = getState().characters.list[socket.user.user_id] || null;
    let message = params.join(' ').trim();

    if (!message || !character) {
        return [];
    }

    return [{
        ...newEvent({
            type: 'local',
            name: socket.user.name,
            message: message
        }),
        meta: {
            target: `${character.location.map}_${character.location.x}_${character.location.y}`
        } 
    }];
}