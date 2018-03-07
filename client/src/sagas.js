import {call, put, take, takeLatest} from 'redux-saga/effects';
import {push} from 'react-router-redux';
import {ACCOUNT_AUTHENTICATE,} from './components/account/types';

function* Redirect(action) {
    yield put(push('/account'));
}

function* Sagas() {
    yield takeLatest(ACCOUNT_AUTHENTICATE, Redirect);
}

export default Sagas;