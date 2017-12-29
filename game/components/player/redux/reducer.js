import { ACCOUNT_AUTHENTICATE } from '../../account/redux/types';

export default function (state = {}, action) {
    switch (action.type) {
        case ACCOUNT_AUTHENTICATE:
            return state;
    }

    return state;
}