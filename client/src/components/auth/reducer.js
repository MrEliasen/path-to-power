import {
    AUTH_STRATEGIES_SAVE,
} from './types';

const defaultState = {
    strategies: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case AUTH_STRATEGIES_SAVE:
            return {
                strategies: action.payload,
            };
    }

    return state;
}
