// authentication
import { ACCOUNT_AUTHENTICATE } from './components/account/redux/types';
import { accountLogin } from './components/account/redux/actions';

// character creation
import { CLIENT_CREATE_CHARACTER, CLIENT_MOVE_CHARACTER } from './components/character/redux/types';
import { createCharacter, moveCharacter } from './components/character/redux/actions';

// commands
import { COMMAND_FROM_CLIENT } from './components/commands/redux/types';
import { execCommand } from './components/commands/redux/actions';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: accountLogin,
    [CLIENT_CREATE_CHARACTER]: createCharacter,
    [COMMAND_FROM_CLIENT]: execCommand,
    [CLIENT_MOVE_CHARACTER]: moveCharacter
};

export default parsers;