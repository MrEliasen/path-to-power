import { CHAT_MESSAGE } from '../types';

export default function cmdWhisper(socket, command, params, Game) {
    if (params.length < 2) {
        return Game.eventToSocket(socket, 'error',  'Invalid whisper. Syntax: /w <username> <message>');
    }

    Game.characterManager.get(socket.user.user_id).then((sender) => {
        const target = params.shift();

        Game.characterManager.getByName(target).then((whisperTarget) => {
            // send message to the socket
            Game.socketManager.dispatchToSocket(socket, {
                type: CHAT_MESSAGE,
                payload: {
                    type: 'whisper-out',
                    name: whisperTarget.name,
                    message: params.join(' ')
                }
            });
            // send message to the target user
            Game.socketManager.dispatchToUser(whisperTarget.user_id, {
                type: CHAT_MESSAGE,
                payload: {
                    type: 'whisper-in',
                    name: sender.name,
                    message: params.join(' ')
                }
            });
        })
        .catch(() => {
            Game.eventToSocket(socket, 'error',  'Invalid whisper target.')
        });
    })
    .catch();
}