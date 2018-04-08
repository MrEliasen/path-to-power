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
import fontawesome from '@fortawesome/fontawesome';
// brands
import faTwitch from '@fortawesome/fontawesome-free-brands/faTwitch';
import faGithub from '@fortawesome/fontawesome-free-brands/faGithub';
// general icons
import faBug from '@fortawesome/fontawesome-free-solid/faBug';
import faBuilding from '@fortawesome/fontawesome-free-solid/faBuilding';
import faUserSecret from '@fortawesome/fontawesome-free-solid/faUserSecret';
import faHandRock from '@fortawesome/fontawesome-free-solid/faHandRock';
import faHandPaper from '@fortawesome/fontawesome-free-solid/faHandPaper';
import faHandPointLeft from '@fortawesome/fontawesome-free-solid/faHandPointLeft';
import faShieldAlt from '@fortawesome/fontawesome-free-solid/faShieldAlt';
import faChartBar from '@fortawesome/fontawesome-free-solid/faChartBar';
import faCog from '@fortawesome/fontawesome-free-solid/faCog';

fontawesome.library.add(
    faBug,
    faBuilding,
    faUserSecret,
    faHandRock,
    faHandPaper,
    faHandPointLeft,
    faShieldAlt,
    faChartBar,
    faCog,
    faGithub,
    faTwitch
);

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
