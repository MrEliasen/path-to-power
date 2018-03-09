import {put, all, takeLatest} from 'redux-saga/effects';

// methods
import {push} from 'react-router-redux';
import axios from 'axios';

// actions
import {authLogin} from './components/account/actions';

// types
import {
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_SAVE,
    ACCOUNT_AUTHENTICATE_SUCCESS,
} from './components/account/types';

// misc
import config from './config';

function* saveAuthDetails(action) {
    yield put.resolve({
        ...action,
        type: ACCOUNT_AUTHENTICATE_SUCCESS,
    });
    yield put(push('/account'));
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

function* onAuthSuccess() {
    yield takeLatest(ACCOUNT_AUTHENTICATE_SAVE, saveAuthDetails);
}

function* Sagas() {
    yield all([
        onAuthSuccess(),
        onAuthAttempt(),
    ]);
}

export default Sagas;
