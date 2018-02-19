import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Events from '../events';
import Location from '../location';
import Shop from '../shop';

import {clearEvents, newEvent} from '../events/actions';
import {newCommand} from './actions';
import {moveCharacter} from '../character/actions';

// Components
import InventoryMenu from '../inventory-menu';
import PlayersMenu from '../players-menu';
import StatsMenu from '../stats-menu';
import Chat from '../chat';

// UI
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import LinearProgress from 'material-ui/LinearProgress';
import AutoComplete from 'material-ui/AutoComplete';

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sidebar: 'players',
            command: '',
            modalShow: false,
            modalData: null,
            autoscroll: true,
        };

        this.isActiveTab = this.isActiveTab.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
        this.setCommand = this.setCommand.bind(this);
        this.sendAction = this.sendAction.bind(this);
    }

    componentWillMount() {
        if (!this.props.character) {
            return this.props.history.push('/auth');
        }

        document.addEventListener('keydown', this.onKeyPress.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyPress.bind(this));
    }

    componentDidUpdate(prevProps) {
        if (this.state.autoscroll) {
            document.getElementsByClassName('c-game__chat')[0].scrollTop = document.getElementsByClassName('c-game__chat')[0].scrollHeight;
        }
    }

    onKeyPress(e) {
        if (!this.props.character) {
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.movePosition(e);
                break;

            case '/':
                // set focus if they are not typing into an input field
                if (!document.activeElement.value) {
                    document.querySelector('.c-game_command input').focus();
                }
                break;
        }
    }

    movePosition(e) {
        // Only act of movement input if we dont have any focused elements, other than body.
        if (document.activeElement !== document.getElementsByTagName('body')[0]) {
            // ignore if an element from the autocomplete is in focus (which is a span)
            if (document.activeElement.tagName === 'SPAN') {
                return;
            }
            // ignore if the focused element value is not empty (eg. input)
            if (document.activeElement.value && document.activeElement.value !== '') {
                return;
            }
        }

        let moveAction = {
            grid: '',
            direction: 0,
        };

        switch (e.key) {
            case 'ArrowUp':
                moveAction.grid = 'y';
                moveAction.direction = -1;
                break;
            case 'ArrowDown':
                moveAction.grid = 'y';
                moveAction.direction = 1;
                break;
            case 'ArrowLeft':
                moveAction.grid = 'x';
                moveAction.direction = -1;
                break;
            case 'ArrowRight':
                moveAction.grid = 'x';
                moveAction.direction = 1;
                break;
            default:
                return;
        }

        this.sendAction(moveCharacter(moveAction));
    }

    isActiveTab(tabName) {
        return this.state.sidebar === tabName ? 'active' : '';
    }

    sendAction(action) {
        this.props.socket.emit('dispatch', action);
    }

    sendCommand(command = null) {
        command = command || {...this.state}.command;

        if (command.toLowerCase() === '/clear') {
            this.props.clearEvents();
        } else if (['/commandlist', '/commands'].includes(command.toLowerCase())) {
            this.props.newEvent({
                type: 'commandlist',
                message: '',
            });
        } else {
            this.props.socket.emit('dispatch', newCommand(command));
        }

        this.setState({command: ''});
    }

    setCommand(command) {
        this.setState({command});
        setTimeout(() => {
            document.querySelector('.c-game_command input').focus();
            document.querySelector('.c-game_command input').setSelectionRange(command.length, command.length);
        }, 250);
    }

    render() {
        return (
            <div className="c-game">
                <Paper zDepth={1} rounded={true} className="c-game__location e-padding">
                    <Location />
                </Paper>
                <div className="c-game__communication">
                    <Paper zDepth={1} rounded={true} className="c-game__news e-padding">
                        {
                            this.props.game.news &&
                            <h3 style={this.props.game.news.colour}>{this.props.game.news.message}</h3>
                        }
                    </Paper>
                    <Paper zDepth={1} rounded={true} className="c-game__chat e-padding">
                        <Chat />
                    </Paper>
                </div>
                <Events />
                <div className="c-game_command">
                    <AutoComplete
                        ref={(e) => this.$autocomplete = e}
                        id="input-command"
                        fullWidth={true}
                        searchText={this.state.command}
                        onUpdateInput={(command) => {
                            this.setState({command: command});
                            setTimeout(() => {
                                document.querySelector('.c-game_command input').focus();
                            }, 100);
                        }}
                        onKeyPress={(e) => {
                            if (e.key && e.key == 'Enter') {
                                this.sendCommand();
                            }
                        }}
                        onNewRequest={() => {
                            document.querySelector('.c-game_command input').focus();
                        }}
                        floatingLabelText="Type your commands here, and hit Enter."
                        floatingLabelStyle={{color: '#FF9800'}}
                        floatingLabelFocusStyle={{color: '#2196F3'}}
                        inputStyle={{color: '#fff'}}
                        filter={(searchText, key) => searchText.length > 1 && key.indexOf(searchText) !== -1}
                        dataSource={Object.keys(this.props.game.commands).concat(['/commandlist', '/commands', '/clear'])}
                        anchorOrigin={{vertical: 'top', horizontal: 'left'}}
                        targetOrigin={{vertical: 'bottom', horizontal: 'left'}}
                        listStyle={{
                            background: '#40C4FF',
                        }}
                        menuStyle={{
                            maxHeight: '150px',
                            overflowY: 'auto',
                        }}
                        menuProps={{
                            id: 'c-autocomplete__menu',
                        }}
                    />
                </div>

                <InventoryMenu sendCommand={this.sendCommand} sendAction={this.sendAction} />
                <PlayersMenu sendCommand={this.sendCommand} setCommand={this.setCommand} />
                <StatsMenu />
                <Shop sendAction={this.sendAction} />

                <Dialog
                    title={this.props.connection.lastEvent}
                    open={!this.props.connection.isConnected}
                    modal={true}
                    titleStyle={{textAlign: 'center'}}
                >
                    <LinearProgress mode="indeterminate" />
                </Dialog>
            </div>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        clearEvents,
        newEvent,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        game: {...state.game},
        character: state.character ? {...state.character} : null,
        socket: state.app.socket,
        connection: {
            isConnected: state.app.connected,
            lastEvent: state.app.connectedEvent,
        },
    };
}

export default withRouter(connect(mapStateToProps, mapActionsToProps)(Game));
