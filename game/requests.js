// authentication
import { ACCOUNT_AUTHENTICATE } from './components/account/redux/types';
import { accountLogin } from './components/account/redux/actions';

// character creation
import { CLIENT_CREATE_CHARACTER } from './components/character/redux/types';
import { createCharacter } from './components/character/redux/actions';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: accountLogin,
    [CLIENT_CREATE_CHARACTER]: createCharacter,
};

export default parsers;