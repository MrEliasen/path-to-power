import { SERVER_TO_CLIENT } from '../socket/redux/types';
import { CLIENT_NEW_MESSAGE } from './redux/types';
import { clientCommandError } from './redux/actions';
import { getCharacterByName } from '../character/db/controller';

export default function cmdWhisper(socket, params, callback) {
    if (params.length < 2) {
        return callback([{
            ...clientCommandError('Invalid whisper. Syntax: /w <username> <message>'),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const playername = params.shift();

    getCharacterByName(playername, function(err, character) {
        if (err) {
            return callback([err]);
        }

        if (!character) {
            return callback([{
                ...clientCommandError('Invalid whisper target.'),
                meta: {
                    socket_id: socket.id
                }
            }]);
        }

        callback([{
            type: CLIENT_NEW_MESSAGE,
            subtype: SERVER_TO_CLIENT,
            meta: {
                target: character.user_id
            },
            payload: {
                type: 'whisper-in',
                name: socket.user.name,
                message: params.join(' ')
            }
        },
        {
            type: CLIENT_NEW_MESSAGE,
            subtype: SERVER_TO_CLIENT,
            meta: {
                socket_id: socket.id
            },
            payload: {
                type: 'whisper-out',
                name: character.name,
                message: params.join(' ')
            }
        }]);
    });
}