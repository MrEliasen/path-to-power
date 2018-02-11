import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleInventoryMenu} from '../inventory-menu/actions';
import {togglePlayersMenu} from '../players-menu/actions';
import {toggleStatsMenu} from '../stats-menu/actions';
import {newCommand} from '../game/actions';
import {clearEvents, newEvent} from '../events/actions';

// UI
import Paper from 'material-ui/Paper';
import {
    BottomNavigation,
    BottomNavigationItem,
} from 'material-ui/BottomNavigation';

// Icons
import Punch from 'material-ui/svg-icons/device/brightness-low';
import Strike from 'material-ui/svg-icons/device/brightness-high';
import Shoot from 'material-ui/svg-icons/device/gps-fixed';
import Clear from 'material-ui/svg-icons/content/delete-sweep';
import Inventory from 'material-ui/svg-icons/image/grid-on';
import Players from 'material-ui/svg-icons/social/people';
import Star from 'material-ui/svg-icons/toggle/star';
import Location from 'material-ui/svg-icons/communication/location-on';

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

    render() {
        return (
            <Paper zDepth={1}>
                <BottomNavigation>
                    <BottomNavigationItem
                        label="Punch"
                        icon={<Punch/>}
                        onClick={() => this.sendCommand('/punch')}
                    />
                    <BottomNavigationItem
                        label="Strike"
                        icon={<Strike/>}
                        onClick={() => this.sendCommand('/strike')}
                    />
                    <BottomNavigationItem
                        label="Shoot"
                        icon={<Shoot/>}
                        onClick={() => this.sendCommand('/shoot')}
                    />
                    <BottomNavigationItem
                        label="Clear Events"
                        icon={<Clear/>}
                        onClick={() => this.sendCommand('/clear')}
                    />
                    <BottomNavigationItem
                        label="Stats"
                        icon={<Star/>}
                        onClick={this.props.toggleStatsMenu}
                    />
                    <BottomNavigationItem
                        label="Inventory"
                        icon={<Inventory/>}
                        onClick={this.props.toggleInventoryMenu}
                    />
                    <BottomNavigationItem
                        label="City Map"
                        icon={<Location/>}
                        onClick={() => this.props.newEvent({
                            type: 'multiline',
                            message: [
                                'Map Locations:',
                                '----------------',
                            ].concat(this.props.structures.map((obj) => {
                                return `The ${obj.name} can be found at North ${obj.location.y} / East ${obj.location.x}`;
                            })),
                        })}
                    />
                    <BottomNavigationItem
                        label="Players"
                        icon={<Players/>}
                        onClick={this.props.togglePlayersMenu}
                    />
                </BottomNavigation>
            </Paper>
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
