import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import config from '../../config';

// UI
import Paper from 'material-ui/Paper';

// Actions
import {authLogin, authError} from './actions';

class Auth extends React.Component {
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
                return authError({
                    message: 'An error occured with Twitch.tv!',
                    type: 'error',
                });
            }

            // if not authenticated already.
            if (!status.authenticated) {
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
            <Paper zDepth={1} rounded={true} className="e-padding">
            {
                this.showStatus()
            }
            </Paper>
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
    return bindActionCreators({authError}, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Auth));
