import {
    CHARACTERS_GET_LIST,
    MAP_GET_LIST,
} from 'shared/actionTypes';

import React from 'react';
import {withRouter} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {CardDeck, Card, CardTitle, CardBody, Button, FormGroup, Input} from 'reactstrap';
import {newCommand} from '../actions';
import {socketSend} from '../../app/actions';
import CharacterCard from './card';
import Notification from '../../ui/notification';

class Character extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: '',
            location: '',
            modalCharacter: false,
        };

        this.selectCharacter = this.selectCharacter.bind(this);
        this.createCharacter = this.createCharacter.bind(this);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }
    }

    componentDidMount() {
        this.props.socketSend({
            type: CHARACTERS_GET_LIST,
            payload: null,
        });
        this.props.socketSend({
            type: MAP_GET_LIST,
            payload: null,
        });
    }

    selectCharacter(name) {
        this.props.newCommand(`/characterselect ${name}`);
    }

    createCharacter() {
        const {name, location} = this.state;
        this.props.newCommand(`/charactercreate ${name} ${location}`);
        this.setState({name: '', location: ''});
    }

    render() {
        return (
            <React.Fragment>
                {
                    !this.props.characterList &&
                    <p>Loading character list..</p>
                }
                <CardDeck>
                    {
                        this.props.characterList &&
                        this.props.characterList.map((obj, index) => <CharacterCard key={index} onSelect={this.selectCharacter} character={obj} />)
                    }
                    <Card>
                        <CardBody>
                            <CardTitle>Create Character</CardTitle>
                            <Notification />
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
                                    value={this.state.location}
                                >
                                    <option value="" defaultValue hidden>Select Start Location</option>
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
                </CardDeck>
            </React.Fragment>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        socketSend,
        newCommand,
    }, dispatch);
}

/**
 * Maps redux state to properties
 * @param  {Object} state Redux store state object
 * @return {Object}
 */
function mapStateToProps(state) {
    return {
        gameMaps: state.game.maps,
        socket: state.app.socket,
        character: state.character.selected,
        characterList: state.character.list,
        loggedIn: state.account.loggedIn,
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Character));
