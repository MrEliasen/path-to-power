import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleInventoryMenu} from '../inventory-menu/actions';
import {togglePlayersMenu} from '../players-menu/actions';
import {toggleStatsMenu} from '../stats-menu/actions';
import {newCommand} from '../actions';
import {clearEvents, newEvent} from '../events/actions';

class BottomMenu extends React.Component {
    constructor(props) {
        super(props);

        this.sendCommand = this.sendCommand.bind(this);
    }

    sendCommand(command) {
        if (command.toLowerCase() === '/clear') {
            this.props.clearEvents();
        } else {
            this.props.socket.emit('dispatch', newCommand(command));
        }
    }

    getMap() {
        this.props.newEvent({
            type: 'multiline',
            message: [
                'Map Locations:',
                '----------------',
            ].concat(this.props.structures.map((obj) => {
                return `The ${obj.name} can be found at North ${obj.location.y} / East ${obj.location.x}`;
            })),
        });
    }

    render() {
        return (
            <div>
                Old menu:
                <ul>
                    <li onClick={() => this.sendCommand('/punch')}>Punch</li>
                    <li onClick={() => this.sendCommand('/strike')}>Strike</li>
                    <li onClick={() => this.sendCommand('/shoot')}>Shoot</li>
                    <li onClick={() => this.sendCommand('/clear')}>Clear Events</li>
                    <li onClick={this.props.toggleStatsMenu}>Stats</li>
                    <li onClick={this.props.toggleInventoryMenu}>Inventory</li>
                    <li onClick={() => this.getMap()}>City Map</li>
                    <li onClick={this.props.togglePlayersMenu}>Players</li>
                </ul>
            </div>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        toggleInventoryMenu,
        togglePlayersMenu,
        toggleStatsMenu,
        clearEvents,
        newEvent,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        structures: state.character ? [
            ...state.game.maps[state.character.location.map].buildings,
        ] : null,
    };
}

export default connect(mapStateToProps, mapActionsToProps)(BottomMenu);
