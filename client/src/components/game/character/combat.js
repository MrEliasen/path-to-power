import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// Game
import {newCommand} from '../actions';

// UI
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {Card} from 'reactstrap';

// TODO: Only show this menu if the player is in combat (Targeting or Targeted)
class CombatMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    sendCommand(command = null) {
        this.props.newCommand(command);
    }

    render() {
        return (
            <Card className="menu menu-combat">
                <a href="#" onClick={() => this.sendCommand('/punch')}><FontAwesomeIcon icon="hand-rock" /> Punch</a>
                <a href="#" onClick={() => this.sendCommand('/strike')}><FontAwesomeIcon icon="hand-paper" /> Strike</a>
                <a href="#" onClick={() => this.sendCommand('/shoot')}><FontAwesomeIcon icon="hand-point-left" /> Shoot</a>
            </Card>
        )
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        newCommand,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        game: {...state.game},
        character: state.character.selected,
    };
}

export default connect(mapStateToProps, mapActionsToProps)(CombatMenu);
