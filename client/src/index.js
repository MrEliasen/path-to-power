import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';

// Redux routing
import createHistory from 'history/createBrowserHistory';
import {ConnectedRouter, routerMiddleware} from 'react-router-redux';
const history = createHistory();
const historyMiddleware = routerMiddleware(history);

import reducers from './reducers';
import App from './components/app';
import sagas from './sagas';

// FontAwesome Setup
import FontAwesome from '@fortawesome/fontawesome';
import FontAwesomeBrands from '@fortawesome/fontawesome-free-brands';
import FontAwesomeIcons from '@fortawesome/fontawesome-free-solid';
FontAwesome.library.add(FontAwesomeBrands, FontAwesomeIcons);

// Styles
import './assets/styles/all.scss';

let store;
const sagaMiddleware = createSagaMiddleware();

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    // browser redux development tools enabled (does not work on mobile)
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    store = createStore(
        reducers,
        composeEnhancers(
            applyMiddleware(sagaMiddleware, historyMiddleware)
        )
    );
} else {
    // Production & mobile tests
    const createStoreWithMiddleware = applyMiddleware(sagaMiddleware, historyMiddleware)(createStore);
    store = createStoreWithMiddleware(reducers);
}

sagaMiddleware.run(sagas);

ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <App/>
        </ConnectedRouter>
    </Provider>,
    document.querySelector('#root')
);
