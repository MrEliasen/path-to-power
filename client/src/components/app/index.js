import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {Route} from 'react-router-dom';

// Pages
import Game from '../game';
import Auth from '../auth';
import Home from '../home';
import Character from '../character';

// Components
import Header from '../header';
import BottomMenu from '../bottom-menu';

// Twitch old ass lib
// TODO: Code own implementation
import '../../assets/twitch';

// extra styles
import '../../assets/styles/app.scss';

// client config
import config from '../../config';

// actions
import {authLogin} from '../auth/actions';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connected: false,
        };
    }

    componentWillUnmount() {
        this.socket.close();
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
            .on('reconnect', this.onReconnect.bind(this))
            .on('dispatch', this.onDispatch.bind(this));
    }

    onConnect() {
        this.setState({connected: true});
    }

    onReconnect() {
        // re-authenticate
        if (Twitch.getToken()) {
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
        this.props.dispatch(data);

        // if the request is a route change, do so here (temp. fix until we implement redux-router)
        if (data.payload.routeTo) {
            this.props.history.push(data.payload.routeTo);
        }
    }

    render() {
        return (
            <React.Fragment>
                <Header socket={this.socket} />
                <div className="c-main">
                    {
                        !this.state.connected &&
                        <div>Connecting...</div>
                    }
                    {
                        this.state.connected &&
                        <React.Fragment>
                            <Route exact path="/" component={Home} />
                            <Route path="/auth" render={() => <Auth socket={this.socket}/>} />
                            <Route path="/game" render={() => <Game socket={this.socket}/>} />
                            <Route path="/character" render={() => <Character socket={this.socket}/>} />
                        </React.Fragment>
                    }
                </div>
                {
                    this.props.character &&
                    <BottomMenu className="c-bottom-menu" socket={this.socket} />
                }
            </React.Fragment>
        );
    }
}

function mapStateToProps(state) {
    return {
        character: state.character ? {...state.character} : null,
    };
}

export default withRouter(connect(mapStateToProps)(App));
