import React from 'react';
import {connect} from 'react-redux';
import {Card, CardBody} from 'reactstrap';
import {CHARACTERS_GET_LIST} from './types';

class CharacterList extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        this.props.socket.emit('dispatch', {
            type: CHARACTERS_GET_LIST,
            payload: null,
        });
    }

    render() {
        return (
            <Card className="card-small">
                <CardBody className="text-center">
                    {
                        !this.props.characters &&
                        <p>Loading character list..</p>
                    }
                    {
                        this.props.characters &&
                        <p>Characters Loaded</p>
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
        socket: state.app.socket,
        characters: state.account.characters || null,
    };
}

export default connect(mapStateToProps)(CharacterList);
