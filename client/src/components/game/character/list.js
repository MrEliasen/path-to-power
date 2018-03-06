import React from 'react';
import {connect} from 'react-redux';
import {withRouter, Link} from 'react-router-dom';
import {Card, CardBody, Button} from 'reactstrap';
import {CHARACTERS_GET_LIST} from './types';
import {newCommand} from '../game/actions';

class CharacterList extends React.Component {
    constructor(props) {
        super(props);

        this.selectCharacter = this.selectCharacter.bind(this);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            this.props.history.push('/auth');
        }
    }

    componentDidMount() {
        this.props.socket.emit('dispatch', {
            type: CHARACTERS_GET_LIST,
            payload: null,
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.character) {
            this.props.history.push('/game');
        }
    }

    selectCharacter(name) {
        this.props.socket.emit('dispatch', newCommand(`/characterselect ${name}`));
    }

    render() {
        return (
            <Card className="card-small">
                <CardBody>
                    <Link className="btn btn-block btn-primary" to={'/account/characters/new'}>Create New Character</Link>
                    {
                        !this.props.characters &&
                        <p>Loading character list..</p>
                    }
                    {
                        this.props.characters &&
                        this.props.characters.map((obj) => <div key={obj.name}>
                            <strong>{obj.name}</strong><br/>
                            <ul>
                                <li>Health: {obj.stats.health}</li>
                                <li>Reputaion: {obj.stats.exp}</li>
                                <li>Cash: {obj.stats.cash}</li>
                                <li>Bank: {obj.stats.bank}</li>
                            </ul>
                            <Button color="success" onClick={() => this.selectCharacter(obj.name)}>Play</Button>
                        </div>)
                    }
                </CardBody>
            </Card>
        );
    }
}

/**
 * Maps redux state to properties
 * @param  {Object} state Redux store state object
 * @return {Object}
 */
function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
        socket: state.app.socket,
        character: state.character.selected,
        characterList: state.character.list,
    };
}

export default withRouter(connect(mapStateToProps)(CharacterList));
