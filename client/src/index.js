import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware, compose} from 'redux';
import {BrowserRouter} from 'react-router-dom';

import reducers from './reducers';
import App from './components/app';

// FontAwesome Setup
import FontAwesome from '@fortawesome/fontawesome';
import FontAwesomeBrands from '@fortawesome/fontawesome-free-brands';
FontAwesome.library.add(FontAwesomeBrands);

// Styles
import './assets/styles/all.scss';

let store;

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    // browser redux development tools enabled (does not work on mobile)
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    store = createStore(
        reducers,
        composeEnhancers(
            applyMiddleware()
        )
    );
} else {
    // Production & mobile tests
    const createStoreWithMiddleware = applyMiddleware()(createStore);
    store = createStoreWithMiddleware(reducers);
}

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
                <App/>
        </BrowserRouter>
    </Provider>,
    document.querySelector('#root')
);
