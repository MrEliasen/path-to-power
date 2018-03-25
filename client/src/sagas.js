import {eventChannel} from 'redux-saga';
import {put, call, all, take, takeLatest, race} from 'redux-saga/effects';

// methods
import {push} from 'react-router-redux';
import axios from 'axios';

// actions
import {saveUserDetails} from './components/account/actions';
import {setConnectionStatus} from './components/app/actions';
import {authLogin, saveStrategies} from './components/auth/actions';

// types
import {
    USER_AUTHENTICATE,
    USER_AUTHENTICATE_ERROR,
    USER_AUTHENTICATE_SUCCESS,
    USER_LOGOUT,
    CHARACTER_LOGOUT,
    MAP_GRID_DETAILS,
    GAME_EVENT,
} from 'shared/actionTypes';
import {
    SOCKET_SEND,
    NOTIFICATION_SET,
    NOTIFICATION_CLEAR,
} from './components/app/types';
import {
    AUTH_STRATEGIES_GET,
    AUTH_PASSWORD_RESET,
    AUTH_LINK,
    AUTH_UNLINK,
    AUTH_SIGNUP,
    AUTH_PROVIDER,
    AUTH_SAVE,
} from './components/auth/types';
import {
    USER_DETAILS_GET,
    USER_DETAILS_UPDATE,
} from './components/account/types';

// misc
import config from './config';
import {cacheGet, cacheSet} from './helper';

function* doAPICall(endpoint, data, method = 'get', additionalHeaders = null) {
    try {
        yield put({
            type: NOTIFICATION_CLEAR,
            payload: null,
        });

        const request = axios.create({
            baseURL: `${config.api.host}/api/`,
            timeout: 10000,
            headers: additionalHeaders,
        });

        return yield call(request[method], `${endpoint}`, data);
    } catch (err) {
        let errorMsg = 'Something went wrong. Please try again in a moment.';

        if (err.response) {
            errorMsg = err.response.data.error || errorMsg;
        }

        yield put({
            type: NOTIFICATION_SET,
            payload: {
                message: errorMsg,
                type: 'error',
            },
        });
    }
}

/*
    Socket
    ------------------------
*/
function* setupWebSocket() {
    while (true) {
        yield take('SOCKET_CONNECT');
        const socket = io(config.socket.host, {
            reconnect: true,
        });
        const socketChannel = yield call(watchMessages, socket);

        const {cancel} = yield race({
            task: [call(externalListener, socketChannel), call(internalListener, socket)],
            cancel: take('STOP_WEBSOCKET'),
        });

        if (cancel) {
            socketChannel.close();
        }
    }
}

function watchMessages(socket) {
    return eventChannel((emit) => {
        socket
            .on('connect', () => {
                emit(setConnectionStatus(true, 'Connected'));
            })
            .on('reconnect', () => {
                emit(setConnectionStatus(true, 'Reconnected'));
            })
            .on('connect_timeout', () => {
                emit(setConnectionStatus(false, 'Connection Timed Out - Reconnecting'));
            })
            .on('disconnect', () => {
                emit(setConnectionStatus(false, 'Connection Closed - Reconnecting'));
            })
            .on('dispatch', (action) => {
                emit(action);
            });

        return () => {
            socket.close();
        };
    });
}

function* internalListener(socket) {
    while (true) {
        const action = yield take(SOCKET_SEND);
        socket.emit('dispatch', action.payload);
    }
}

function gridDetails(action) {
    const {players, npcs, items, location} = action.payload;

    return {
        type: GAME_EVENT,
        payload: {
            type: 'grid-details',
            players,
            npcs,
            items,
            location,
        },
    };
}

function* externalListener(channel) {
    while (true) {
        let action = yield take(channel);

        if (action.type === MAP_GRID_DETAILS) {
            const {players, npcs, items} = action.payload;

            // if the grid has any items, players or NPCS, show them once in the events.
            if ((players && players.length) || (npcs && npcs.length) || (items && items.length)) {
                yield put(gridDetails(action));
            }
        }

        yield put(action);
    }
}

/*
    Account/Auth
    ------------------------
*/
function* saveAuthDetails(action) {
    yield put({
        type: SOCKET_SEND,
        payload: {
            type: USER_AUTHENTICATE,
            payload: action.payload,
        },
    });

    const result = yield race([
        take(USER_AUTHENTICATE_ERROR),
        take(USER_AUTHENTICATE_SUCCESS),
    ]);

    if (result[0]) {
        yield put({
            type: NOTIFICATION_SET,
            payload: {
                message: result[0].payload,
                type: 'error',
            },
        });
        yield logoutAccount();
        return result[0];
    }

    localStorage.setItem('authToken', action.payload);

    yield put.resolve({
        ...result[1],
        payload: {
            ...result[1].payload,
            authToken: action.payload,
        },
    });
    yield put(push('/account'));
}

function* logoutAccount(action = null) {
    localStorage.removeItem('authToken');

    if (action) {
        yield put({
            type: SOCKET_SEND,
            payload: action,
        });

        yield put(push('/auth/logout'));
        return action;
    }
}

function* logoutGame(action) {
    yield put({
        type: SOCKET_SEND,
        payload: action,
    });
    return action;
}

function* checkLocalAuth(action) {
    const data = {
        email: action.payload.email,
        password: action.payload.password,
        method: 'local',
    };

    const response = yield call(doAPICall, 'auth', data, 'post');

    if (!response) {
        return;
    }

    yield put(authLogin(response.data.authToken));
}

function* checkProviderAuth(action) {
    const data = {
        providerToken: action.payload.providerToken,
    };

    const response = yield call(doAPICall, 'auth', data, 'post');

    if (!response) {
        return;
    }

    yield put(authLogin(response.data.authToken));
}

function* signUpUser(action) {
    const data = {
        email: action.payload.email,
        password: action.payload.password,
        passwordConfirm: action.payload.passwordConfirm,
        method: 'local',
    };

    const response = yield call(doAPICall, 'users', data, 'post');

    if (!response) {
        return;
    }

    yield put({
        type: NOTIFICATION_SET,
        payload: {
            message: response.data.message,
            type: 'success',
        },
    });
}

function* getAuthStrategies(action) {
    let authList = cacheGet('strategies');

    if (!authList) {
        const response = yield call(doAPICall, 'auth', {});

        if (!response) {
            return;
        }

        authList = response.data.authlist;
        cacheSet('strategies', authList);
    }

    yield put(saveStrategies(authList));
}

function* resetPassword(action) {
    const response = yield call(doAPICall, 'auth/reset', {
        email: action.payload,
    }, 'post');

    if (!response) {
        return;
    }

    yield put({
        type: NOTIFICATION_SET,
        payload: {
            message: response.data.message,
            type: 'success',
        },
    });
}

function* updateUserDetails(action) {
    const response = yield call(doAPICall, `users/${action.payload.userId}`, action.payload.details, 'patch', {
        Authorization: `Bearer ${action.payload.authToken}`,
    });

    if (!response) {
        return;
    }

    yield put(saveUserDetails({
        hasPassword: response.data.hasPassword,
        email: response.data.email,
    }));

    yield put({
        type: NOTIFICATION_SET,
        payload: {
            message: response.data.message || 'Your details has been updated!',
            type: 'success',
        },
    });
}

function* getUserDetails(action) {
    const response = yield call(doAPICall, `users/${action.payload.userId}`, null, 'get', {
        Authorization: `Bearer ${action.payload.authToken}`,
    });

    if (!response) {
        return;
    }

    yield put(saveUserDetails(response.data.user));
}

function* linkProviderToAccount(action) {
    const response = yield call(doAPICall, 'auth/link', {
        provider: action.payload.providerToken,
        authToken: action.payload.authToken,
    }, 'post');

    if (!response) {
        return;
    }
}

function* unlinkProviderFromAccount(action) {
    const response = yield call(doAPICall, 'auth/unlink', {
        provider: action.payload.provider,
    }, 'post', {
        Authorization: `Bearer ${action.payload.authToken}`,
    });

    if (!response) {
        return;
    }

    yield getUserDetails(action);
}

function* onAuthAttempt() {
    yield takeLatest(USER_AUTHENTICATE, checkLocalAuth);
}

function* onProviderAuthAttempt() {
    yield takeLatest(AUTH_PROVIDER, checkProviderAuth);
}

function* onGameLogout() {
    yield takeLatest(CHARACTER_LOGOUT, logoutGame);
}

function* onAccountLogout() {
    yield takeLatest(USER_LOGOUT, logoutAccount);
}

function* onAuthSuccess() {
    yield takeLatest(AUTH_SAVE, saveAuthDetails);
}

function* onSignUpAttempt() {
    yield takeLatest(AUTH_SIGNUP, signUpUser);
}

function* onFetchStrategies() {
    yield takeLatest(AUTH_STRATEGIES_GET, getAuthStrategies);
}

function* onResetPassword() {
    yield takeLatest(AUTH_PASSWORD_RESET, resetPassword);
}

function* onFetchUserDetails() {
    yield takeLatest(USER_DETAILS_GET, getUserDetails);
}

function* onUpdateUserDetails() {
    yield takeLatest(USER_DETAILS_UPDATE, updateUserDetails);
}

function* onLinkProvider() {
    yield takeLatest(AUTH_LINK, linkProviderToAccount);
}

function* onUnlinkProvider() {
    yield takeLatest(AUTH_UNLINK, unlinkProviderFromAccount);
}

/* ** ** ** ** **  ** ** ** ** ** ** */

function* routeChanged() {
    yield put({
        type: NOTIFICATION_CLEAR,
        payload: null,
    });
}

function* onRouteChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', routeChanged);
}

function* Sagas() {
    yield all([
        onAuthSuccess(),
        onAccountLogout(),
        onGameLogout(),
        onAuthAttempt(),
        setupWebSocket(),
        onSignUpAttempt(),
        onRouteChange(),
        onFetchStrategies(),
        onResetPassword(),
        onFetchUserDetails(),
        onUpdateUserDetails(),
        onLinkProvider(),
        onProviderAuthAttempt(),
        onUnlinkProvider(),
    ]);
}

export default Sagas;
