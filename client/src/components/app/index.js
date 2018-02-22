import React from 'react';
import {bindActionCreators} from 'redux';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {Route} from 'react-router-dom';

// Pages
import PageHome from '../page/home';
import PageInfo from '../page/info';
import PageGuides from '../page/guides';
import PageAbout from '../page/about';

import AuthContainer from '../auth';
import GameContainer from '../game';
import Character from '../game/character';

// Components
import Header from './header';

// Twitch old ass lib
// TODO: Code own implementation
import '../../assets/twitch';

// client config
import config from '../../config';

// actions
import {authLogin} from '../auth/actions';
import {setConnectionStatus, setSocket, dispatchServerAction} from './actions';

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        if (this.socket) {
            this.socket.close();
        }
    }

    componentDidMount() {
        this.connect();
    }

    /**
     * Setup the socket io client, and connect to the server
     */
    connect() {
        this.socket = io(config.socket.host, {
            reconnect: true,
        });

        this.socket
            .on('connect', this.onConnect.bind(this))
            .on('reconnect', this.onConnect.bind(this))
            .on('connect_timeout', this.onTimeout.bind(this))
            .on('disconnect', this.onTimeout.bind(this))
            .on('reconnect', this.onReconnect.bind(this))
            .on('dispatch', this.onDispatch.bind(this));

        this.props.setSocket(this.socket);
    }

    onConnect() {
        this.props.setConnectionStatus(true, 'Connected');
    }

    onTimeout() {
        this.props.setConnectionStatus(false, 'Connection Timed Out - Reconnecting');
    }

    onReconnect() {
        // re-authenticate
        if (Twitch.getToken() && this.socket) {
            this.socket.emit('dispatch', authLogin({
                twitch_token: Twitch.getToken(),
            }));
        }
    }

    onDispatch(data) {
        // if the dispatch has an ignore tag, and the user is defined within this tag, ignore the dispatch
        if (data.payload && data.payload.ignore) {
            if (this.props.character && data.payload.ignore.includes(this.props.character.user_id)) {
                return;
            }
        }

        // dispatch the action to redux store.
        this.props.dispatchServerAction(data);

        // if the request is a route change, do so here (temp. fix until we implement redux-router)
        if (data.payload.routeTo) {
            this.props.history.push(data.payload.routeTo);
        }
    }

    render() {
        return (
            <React.Fragment>
                <Header />
                <Route exact path="/" component={() => (<div id="featured" />)} />
                <main id="main">
                    <div className="container">
                        <Route exact path="/" component={PageHome} />
                        <Route path="/info" component={PageInfo} />
                        <Route path="/guides" component={PageGuides} />
                        <Route path="/about" component={PageAbout} />
                        <Route path="/auth" component={AuthContainer} />
                        <Route path="/game" component={GameContainer} />
                        <Route path="/character" component={Character} />
                    </div>
                </main>
            </React.Fragment>
        );
    }
}

function bindActionsToProps(dispatch) {
    return bindActionCreators({
        setConnectionStatus,
        setSocket,
        dispatchServerAction,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        character: state.character ? {...state.character} : null,
    };
}

export default withRouter(connect(mapStateToProps, bindActionsToProps)(App));
