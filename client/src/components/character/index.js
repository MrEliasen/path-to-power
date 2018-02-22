import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';

// actions
import {createCharacter} from './actions';

class Character extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            city: '',
        };
    }

    componentWillMount() {
        if (!Twitch.getToken()) {
            return this.props.history.push('/auth');
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.characterLoaded) {
            return this.props.history.push('/game');
        }
    }

    signup() {
        this.props.socket.emit('dispatch', createCharacter({
            location: this.state.city,
        }));
    }

    render() {
        return (
            <div className="c-character">
                <div className="__form">
                    <h3>Create Character</h3>

                    <select
                        fullWidth={true}
                        onChange={(event, key, payload) => {
                            this.setState({city: payload});
                        }}
                        value={this.state.city}
                        floatingLabelText="Select Start City"
                        floatingLabelStyle={{color: '#FF9800'}}
                        floatingLabelFocusStyle={{color: '#2196F3'}}
                    >
                        {
                            Object.keys(this.props.game.maps).map((mapId) =>
                                <option
                                    key={mapId}
                                    value={mapId}
                                >{this.props.game.maps[mapId].name}</option>
                            )
                        }
                    </select>

                    {
                        this.props.error &&
                        <p>{this.props.error}</p>
                    }

                    <button onClick={this.signup.bind(this)}>Create Character</button>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        characterLoaded: state.character ? true : false,
        game: {...state.game},
        error: state.auth ? state.auth.message : null,
        socket: state.app.socket,
    };
}

export default withRouter(connect(mapStateToProps)(Character));
