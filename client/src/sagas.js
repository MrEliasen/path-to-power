import {eventChannel} from 'redux-saga';
import {put, call, all, take, takeLatest, race} from 'redux-saga/effects';

// methods
import {push} from 'react-router-redux';
import axios from 'axios';

// actions
import {authLogin} from './components/account/actions';
import {setConnectionStatus} from './components/app/actions';

// types
import {SOCKET_SEND, SOCKET_LOGOUT} from './components/app/types';
import {GAME_LOGOUT} from './components/game/types';
import {
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_SAVE,
    ACCOUNT_AUTHENTICATE_SUCCESS,
    ACCOUNT_AUTHENTICATE_ERROR,
    ACCOUNT_LOGOUT,
} from './components/account/types';

// misc
import config from './config';
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
            type: 'ACCOUNT_AUTHENTICATE',
            payload: action.payload,
        },
    });

    const result = yield race([
        take(ACCOUNT_AUTHENTICATE_ERROR),
        take(ACCOUNT_AUTHENTICATE_SUCCESS),
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
    try {
        const response = yield axios.post(`${config.api.host}/api/auth`, {
            email: action.payload.email,
            password: action.payload.password,
            method: 'local',
        });

        yield put(authLogin(response.data.authToken));
    } catch (err) {
        let errorMsg = 'Something went wrong. Please try again in a moment.';

        if (err.response) {
            errorMsg = err.response.data.error || errorMsg;
        }

        yield put({
            type: 'NOTIFICATION_NEW',
            payload: {
                message: errorMsg,
                isError: true,
            },
        });
    }
}

function* onAuthAttempt() {
    yield takeLatest(ACCOUNT_AUTHENTICATE, checkLocalAuth);
}

function* onGameLogout() {
    yield takeLatest(GAME_LOGOUT, logoutGame);
}

function* onAccountLogout() {
    yield takeLatest(ACCOUNT_LOGOUT, logoutAccount);
}

function* onAuthSuccess() {
    yield takeLatest(ACCOUNT_AUTHENTICATE_SAVE, saveAuthDetails);
}

/* ** ** ** ** **  ** ** ** ** ** ** */

function* Sagas() {
    yield all([
        onAuthSuccess(),
        onAccountLogout(),
        onGameLogout(),
        onAuthAttempt(),
        setupWebSocket(),
    ]);
}

export default Sagas;
