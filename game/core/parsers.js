// Handlers
import { login } from '../components/account/db/controller';

// Types
import { ACCOUNT_AUTHENTICATE } from '../components/account/redux/types';

const parsers = {
    [ACCOUNT_AUTHENTICATE]: login
};

export default parsers;