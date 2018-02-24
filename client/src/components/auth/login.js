import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import config from '../../config';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';

// Actions
import {authLogin, newAuthError} from './actions';

class AuthLogin extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.characterLoaded) {
            return this.props.history.push('/game');
        }

        if (!this.props.isConnected && nextProps.isConnected) {
            this.authenticate(nextProps.socket);
        }
    }

    authenticate(socket) {
        Twitch.events.addListener('auth.login', () => {
            socket.emit('dispatch', authLogin({
                twitch_token: Twitch.getToken(),
            }));
        });

        Twitch.init({
            clientId: config.twitch.clientId,
        }, (error, status) => {
            if (error) {
                return this.props.newAuthError({
                    message: 'An error occured with Twitch.tv!',
                    type: 'error',
                });
            }

            // if not authenticated already.
            if (!status.authenticated) {
                if (window.location.pathname === '/auth') {
                    return this.props.history.push('/');
                }

                if (!status.token) {
                    return this.props.newAuthError({
                        message: 'Authentication error. Twitch login was likely cancelled.',
                        type: 'error',
                    });
                }

                return Twitch.login({
                    scope: config.twitch.scope,
                });
            }
        });
    }

    showStatus() {
        if (!this.props.authError) {
            return <p>Authenticating...</p>;
        }

        if (this.props.authError) {
            return <p className="alert alert-error">
                {this.props.authError.message}
            </p>;
        }

        return null;
    }

    render() {
        return (
            <div className="panel">
                <div className="panel-title">Let's do this!</div>
                <div className="panel-body">
                    {this.showStatus()}
                    <form>
                        <input className="input" type="email" name="email" value="" placeholder="Email" autoComplete="email" />
                        <input className="input" type="password" name="password" value="" placeholder="Password" autoComplete="current-password" />
                        <button>Login</button>
                    </form>
                    <hr />
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                    <a className="button block" style={{backgroundColor: '#6441a5'}} href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}>
                        <FontAwesomeIcon icon={['fab', 'twitch']} /> Login with Twitch.tv
                    </a>
                </div>
            </div>
        );
    }
};

function mapStateToProps(state) {
    return {
        characterLoaded: state.character ? true : false,
        authError: {...state.auth},
        isConnected: state.app.connected,
        socket: state.app.socket,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({newAuthError}, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLogin));
