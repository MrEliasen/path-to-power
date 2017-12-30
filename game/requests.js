// AUTHENTICATION
import { accountLogin } from './components/account/redux/actions';
import { ACCOUNT_AUTHENTICATE } from './components/account/redux/types';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: accountLogin,
};

export default parsers;