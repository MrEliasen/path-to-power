import { ACCOUNT_AUTHENTICATE } from './types';
import { login } from '../db/controller';

export function accountLogin(auth_data) {
    return {
        type: ACCOUNT_AUTHENTICATE,
        payload: login(auth_data)
    }
}