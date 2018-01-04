// Authentication
import { ACCOUNT_AUTHENTICATE } from './components/account/redux/types';
import { accountLogin } from './components/account/redux/actions';

// Character creation
import { CLIENT_CREATE_CHARACTER, CLIENT_MOVE_CHARACTER } from './components/character/redux/types';
import { createCharacter, moveCharacter } from './components/character/redux/actions';

// Commands
import { COMMAND_FROM_CLIENT } from './components/commands/redux/types';
import { execCommand } from './components/commands/redux/actions';

// shops
import { SHOP_BUY, SHOP_SELL } from './components/shop/redux/types';
import { shopPurchase, shopSell } from './components/shop/redux/actions';

// The socket will check the ACTION_TYPE of any actions from the client,
// and pass on the action to the matching function here. 
const requestParsers = {
    [ACCOUNT_AUTHENTICATE]: accountLogin,
    [CLIENT_CREATE_CHARACTER]: createCharacter,
    [COMMAND_FROM_CLIENT]: execCommand,
    [CLIENT_MOVE_CHARACTER]: moveCharacter,
    [SHOP_BUY]: shopPurchase,
    [SHOP_SELL]: shopSell
};

export default requestParsers;