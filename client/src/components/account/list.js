import React from 'react';
import {connect} from 'react-redux';
import {withRouter, Link} from 'react-router-dom';
import {Card, CardBody} from 'reactstrap';
import {CHARACTERS_GET_LIST} from './types';

class CharacterList extends React.Component {
    constructor(props) {
        super(props);
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
        characters: state.account.characters || null,
    };
}

export default withRouter(connect(mapStateToProps)(CharacterList));
