import { CHAT_MESSAGE } from './types';
import { NEW_EVENT } from '../../types';

function cmdGlobal(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            Game.socketManager.dispatchToServer({
                type: CHAT_MESSAGE,
                payload: {
                    name: character.name,
                    message: params.join(' '),
                    type: 'global'
                }
            })
        })
        .catch(Game.logger.error)
}

function cmdSay(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            Game.socketManager.dispatchToRoom(`${character.location.map}_${character.location.y}_${character.location.x}`, {
                type: NEW_EVENT,
                payload: {
                    name: character.name,
                    message: params.join(' '),
                    type: 'local'
                }
            })
        })
        .catch(Game.logger.error)
}

function cmdWhisper(socket, command, params, Game) {
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

module.exports = [
    {
        commandKeys: [
            '/global',
            '/g'
        ],
        method: cmdGlobal
    },
    {
        commandKeys: [
            '/say',
            '/s'
        ],
        method: cmdSay
    },
    {
        commandKeys: [
            '/whisper',
            '/w',
            '/tell',
            '/pm'
        ],
        method: cmdWhisper
    },

];