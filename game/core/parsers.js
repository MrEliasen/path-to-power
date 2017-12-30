// Handlers
import { addOnlinePlayer, removeOnlinePlayer } from '../components/player/redux/actions';
import { login } from '../components/account/db/controller';

// Types
import { ACCOUNT_AUTHENTICATE } from '../components/account/redux/types';
import { GAME_ADD_PLAYER, GAME_REMOVE_PLAYER } from './redux/types';
import { SERVER_TO_CLIENT } from './redux/types';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: login,
    [GAME_ADD_PLAYER]: (action) => {
        return {
            ...addOnlinePlayer(action.payload),
            subtype: SERVER_TO_CLIENT
        }
    },
    [GAME_REMOVE_PLAYER]: (action) => {
        return {
            ...removeOnlinePlayer(action.payload),
            subtype: SERVER_TO_CLIENT
        }
    },
};

export default parsers;