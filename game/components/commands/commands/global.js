import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { CLIENT_NEW_MESSAGE } from '../redux/types';
import { newEvent } from '../../socket/redux/actions';

export default function cmdGlobal(socket, params) {
    return [{
        type: CLIENT_NEW_MESSAGE,
        subtype: SERVER_TO_CLIENT,
        payload: {
            name: socket.user.name,
            message: params.join(' '),
            type: 'global'
        }
    }];
}