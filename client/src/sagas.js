import {eventChannel} from 'redux-saga';
import {put, call, all, take, takeLatest, race} from 'redux-saga/effects';

// methods
import {push} from 'react-router-redux';
import axios from 'axios';

// actions
import {authLogin} from './components/account/actions';
import {setConnectionStatus} from './components/app/actions';

// types
import {
    USER_AUTHENTICATE,
    USER_AUTHENTICATE_ERROR,
    USER_AUTHENTICATE_SUCCESS,
    USER_LOGOUT,
    CHARACTER_LOGOUT,
} from 'shared/actionTypes';
import {
    SOCKET_SEND,
    NOTIFICATION_SET,
    NOTIFICATION_CLEAR,
} from './components/app/types';
import {saveStrategies} from './components/auth/actions';
import {AUTH_STRATEGIES_GET} from './components/auth/types';
import {ACCOUNT_AUTHENTICATE_SAVE, USER_SIGNUP} from './components/account/types';

// misc
import config from './config';
import {cacheGet, cacheSet} from './helper';

function* doAPICall(endpoint, data, method = 'get') {
    try {
        yield put({
            type: NOTIFICATION_CLEAR,
            payload: null,
        });

        return yield call(axios[method], `${config.api.host}/api/${endpoint}`, data);
    } catch (err) {
        console.log(err);
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

function* externalListener(channel) {
    while (true) {
        let action = yield take(channel);
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
        return result[0];
    }

    yield put.resolve({
        ...result[1],
        payload: {
            ...result[1].payload,
            authToken: action.payload,
        },
    });
    yield put(push('/account'));
}

function* logoutAccount(action) {
    yield put({
        type: SOCKET_SEND,
        payload: action,
    });
    yield put(push('/auth/logout'));
    return action;
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
        cacheSet('strategies', authList, 600);
    }

    yield put(saveStrategies(authList));
}

function* onAuthAttempt() {
    yield takeLatest(USER_AUTHENTICATE, checkLocalAuth);
}

function* onGameLogout() {
    yield takeLatest(CHARACTER_LOGOUT, logoutGame);
}

function* onAccountLogout() {
    yield takeLatest(USER_LOGOUT, logoutAccount);
}

function* onAuthSuccess() {
    yield takeLatest(ACCOUNT_AUTHENTICATE_SAVE, saveAuthDetails);
}

function* onSignUpAttempt() {
    yield takeLatest(USER_SIGNUP, signUpUser);
}

function* onFetchStrategies() {
    yield takeLatest(AUTH_STRATEGIES_GET, getAuthStrategies);
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
    ]);
}

export default Sagas;
