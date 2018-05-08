import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// Game
import {newCommand} from '../actions';

// UI
import Icon from '@fortawesome/react-fontawesome';
import {Card} from 'reactstrap';

// TODO: Only show this menu if the player is in combat (Targeting or Targeted)
class CombatMenu extends React.Component {
    constructor(props) {
        super(props);
    }

    sendCommand(e, command = null) {
        e.preventDefault();
        this.props.newCommand(command);
    }

    render() {
        let target = this.props.character.target;

        if (target && target.isNPC) {
            target = this.props.npcs.find((obj) => {
                return obj.id === target.id;
            });
        }

        if (!target) {
            return null;
        }

        return (
            <Card className="menu menu-combat">
                <a href="#" onClick={(e) => this.sendCommand(e, '/punch')}><Icon icon="hand-rock" /> Punch</a>
                <a href="#" onClick={(e) => this.sendCommand(e, '/strike')}><Icon icon="hand-paper" /> Strike</a>
                <a href="#" onClick={(e) => this.sendCommand(e, '/shoot')}><Icon icon="hand-point-left" /> Shoot</a>
                <span>
                    {target.name} {target.type ? `the ${target.type} (HP: ${target.health})` : ''}
                </span>
            </Card>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        newCommand,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        npcs: state.map.npcs,
        character: state.character.selected,
    };
}

export default connect(mapStateToProps, mapActionsToProps)(CombatMenu);
