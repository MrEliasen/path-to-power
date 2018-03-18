import {
    USER_DETAILS,
    USER_DETAILS_GET,
    USER_DETAILS_UPDATE,
} from './types';

export function getUserDetails(userId, authToken) {
    return {
        type: USER_DETAILS_GET,
        payload: {
            userId,
            authToken,
        },
    };
}

export function saveUserDetails(userDetails) {
    return {
        type: USER_DETAILS,
        payload: userDetails,
    };
}

export function updateAccount(userId, authToken, details) {
    return {
        type: USER_DETAILS_UPDATE,
        payload: {
            authToken,
            userId,
            details,
        },
    };
}
