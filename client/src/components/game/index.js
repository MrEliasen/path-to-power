import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Events from './events';
import Location from './location';
import Shop from './shop';
import BottomMenu from './bottom-menu';

import {clearEvents, newEvent} from './events/actions';
import {newCommand} from './actions';
import {moveCharacter} from './character/actions';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';

// Components
import {Row, Col, Input, Card, CardHeader, CardBody} from 'reactstrap';
import InventoryMenu from './inventory-menu';
import PlayersMenu from './players-menu';
import StatsMenu from './stats-menu';
import Chat from './chat';

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
            document.querySelector('.card-chat').scrollTop = document.querySelector('.card-chat').scrollHeight;
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
                    document.querySelector('#input-command').focus();
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
            document.querySelector('#input-command').focus();
            document.querySelector('#input-command').setSelectionRange(command.length, command.length);
        }, 250);
    }

    render() {
        return (
            <React.Fragment>
                <div id="game">
                    <Row>
                        <Col className="left">
                            <Card>
                                <CardHeader>Character</CardHeader>
                                <CardBody>
                                    <StatsMenu />
                                </CardBody>
                            </Card>
                            <Card>
                                <CardHeader>Location</CardHeader>
                                <CardBody>
                                    [Minimap]
                                    <hr />
                                    <Location />
                                </CardBody>
                            </Card>
                            <Card>
                                <CardHeader>Equipment</CardHeader>
                                <CardBody>
                                    <InventoryMenu sendCommand={this.sendCommand} sendAction={this.sendAction} />
                                </CardBody>
                            </Card>
                            <Card>
                                <CardHeader>Players Online</CardHeader>
                                <CardBody>
                                    <PlayersMenu sendCommand={this.sendCommand} setCommand={this.setCommand} />
                                </CardBody>
                            </Card>
                            {
                                this.props.character &&
                                <BottomMenu className="c-bottom-menu" socket={this.props.socket} />
                            }
                        </Col>
                        <Col sm="9" className="middle">
                            <Card>
                                <ul className="toolbar">
                                    <li><span><FontAwesomeIcon icon="dollar-sign" /> ?</span></li>
                                    <li><a href="#"><FontAwesomeIcon icon="map-marker-alt" /> Map</a></li>
                                    <li><a href="#"><FontAwesomeIcon icon="shield-alt" /> Inventory: ?/?</a></li>
                                    <li><a href="#"><FontAwesomeIcon icon="shopping-cart" /> Shop</a></li>
                                    <li><a href="#"><FontAwesomeIcon icon="tasks" /> Quests: ?</a></li>
                                    <li><a href="#"><FontAwesomeIcon icon="user-secret" /> Players: ?</a></li>
                                </ul>
                            </Card>
                            <Card>
                                <CardHeader>Chat</CardHeader>
                                <CardBody className="card-messages card-chat">
                                    <Chat />
                                </CardBody>
                            </Card>
                            <Card>
                                <CardHeader>Events</CardHeader>
                                <CardBody className="card-messages card-events">
                                    <Events />
                                </CardBody>
                            </Card>
                            <Input
                                id="input-command"
                                onKeyPress={(e) => {
                                    if (e.key && e.key == 'Enter') {
                                        this.sendCommand();
                                    }
                                }}
                                onChange={(e) => {
                                    this.setState({command: e.target.value});
                                }}
                                value={this.state.command}
                                placeholder="Type your commands here, and hit Enter."
                                type="input"
                                name="input"
                            />
                            {
                                this.props.game.news &&
                                <h3 style={this.props.game.news.colour}>{this.props.game.news.message}</h3>
                            }
                            <div style={{textAlign: 'center'}}>
                                {this.props.connection.lastEvent}<br />
                                {!this.props.connection.isConnected}
                                <div mode="indeterminate" />
                            </div>
                        </Col>
                    </Row>
                </div>
                <Shop sendAction={this.sendAction} />
            </React.Fragment>
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
