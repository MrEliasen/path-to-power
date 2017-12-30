// AUTHENTICATION
import { login } from './components/account/db/controller';
import { ACCOUNT_AUTHENTICATE } from './components/account/redux/types';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: login,
};

export default parsers;