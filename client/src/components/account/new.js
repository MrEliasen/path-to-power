import React from 'react';
import {connect} from 'react-redux';
import {Card, CardBody, FormGroup, Button, Input} from 'reactstrap';
import {newCommand} from '../game/actions';

class CharacterCreate extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: '',
            location: '',
        };

        this.createCharacter = this.createCharacter.bind(this);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            this.props.history.push('/auth');
        }
    }

    createCharacter() {
        const {name, location} = this.state;
        this.props.socket.emit('dispatch', newCommand(`/createcharacter ${name} ${location}`));
    }

    render() {
        return (
            <Card className="card-small">
                <CardBody className="text-center">
                    <FormGroup>
                        <Input
                            type="text"
                            placeholder="Enter character name"
                            onChange={(e) => {
                                this.setState({
                                    name: e.target.value,
                                });
                            }}
                            value={this.state.name}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Input
                            type='select'
                            onChange={(e) => {
                                this.setState({
                                    location: e.target.value,
                                });
                            }}
                        >
                            <option value="" disabled defaultValue hidden>Select Start Location</option>
                            {
                                Object.keys(this.props.gameMaps).map((mapId) => {
                                    return <option key={mapId} value={`"${this.props.gameMaps[mapId].name}"`}>{this.props.gameMaps[mapId].name}</option>;
                                })
                            }
                        </Input>
                    </FormGroup>
                    <Button color='primary' block={true} onClick={this.createCharacter}>Create Character</Button>
                </CardBody>
            </Card>
        );
    }
}

/**
 * Maps redux state data to component props
 * @param  {Object} state Reduct store state
 * @return {Object}
 */
function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
        gameMaps: state.game.maps,
        socket: state.app.socket,
    };
}

export default connect(mapStateToProps)(CharacterCreate);
