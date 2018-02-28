import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {Container, Card, CardHeader, CardBody, Input, Button, FormGroup} from 'reactstrap';

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
            <Card className="card-small">
                <CardHeader>Welcome! Let's create a new character...</CardHeader>
                <CardBody className="text-center">
                    {
                        this.props.error &&
                        <p>{this.props.error}</p>
                    }
                    <form>
                        <p>Select a city...</p>
                        <FormGroup>
                            <Input
                                type="select"
                                onChange={(event, key, payload) => {
                                    this.setState({city: payload});
                                }}
                                value={this.state.city}
                            >
                                {
                                    Object.keys(this.props.game.maps).map((mapId) =>
                                        <option
                                            key={mapId}
                                            value={mapId}
                                        >{this.props.game.maps[mapId].name}</option>
                                    )
                                }
                            </Input>
                        </FormGroup>
                        <Button color="primary" onClick={this.signup.bind(this)}>Create character</Button>
                    </form>
                </CardBody>
            </Card>
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
