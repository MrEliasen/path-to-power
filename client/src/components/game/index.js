import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import HTML5Backend from 'react-dnd-html5-backend';
import {DragDropContext as dragDropContext} from 'react-dnd';

import Events from './events';
import Location from './location';
// import Shop from './shop';
import BottomMenu from './bottom-menu';

import {clearEvents, newEvent} from './events/actions';
import {newCommand} from './actions';
import {moveCharacter} from './character/actions';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';

// Components
import {Row, Col, Input, Card, CardHeader, CardBody, Modal, ModalHeader, ModalBody} from 'reactstrap';
import InventoryMenu from './inventory-menu';
import PlayersMenu from './players-menu';
import StatsMenu from './stats-menu';
import Chat from './chat';
import Inventory from './inventory';
import ItemSlot from './itemslot';
import Character from './character';
import CharacterCard from './character/card';

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sidebar: 'players',
            command: '',
            modalShow: false,
            modalData: null,
            autoscroll: true,

            modalShop: false,
            modalEquipment: false,
        };

        this.isActiveTab = this.isActiveTab.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
        this.setCommand = this.setCommand.bind(this);
        this.sendAction = this.sendAction.bind(this);

        this.toggleShop = this.toggleShop.bind(this);
        this.toggleEquipment = this.toggleEquipment.bind(this);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }

        this.props.socket.emit('dispatch', {
            type: 'ACCOUNT_AUTHENTICATE',
            payload: this.props.authToken,
        });

        document.addEventListener('keydown', this.onKeyPress.bind(this));
    }

    componentWillUnmount() {
        this.props.socket.emit('logout');
        document.removeEventListener('keydown', this.onKeyPress.bind(this));
    }

    componentDidUpdate(prevProps) {
        if (!this.props.character) {
            return;
        }
        if (this.state.autoscroll) {
            // document.querySelector('.card-chat').scrollTop = document.querySelector('.card-chat').scrollHeight;
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

    toggleShop() {
        this.setState({modalShop: !this.state.modalShop});
    }

    toggleEquipment() {
        this.setState({modalEquipment: !this.state.modalEquipment});
    }

    renderModals() {
        return (
            <React.Fragment>
                <Modal isOpen={this.state.modalEquipment} toggle={this.toggleEquipment} size="lg">
                    <ModalHeader toggle={this.toggleEquipment}>Equipment</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs="6">
                                <div id="equipment">
                                    <ItemSlot slotId="head" />
                                </div>
                            </Col>
                            <Col xs="6">
                                <Inventory />
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalShop} toggle={this.toggleShop} size="lg">
                    <ModalHeader toggle={this.toggleShop}>Shop</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs="6">
                                <div id="shop">
                                    Shop slots...
                                </div>
                            </Col>
                            <Col xs="6">
                                <Inventory />
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
            </React.Fragment>
        );
    }

    renderUI() {
        // If the user hasn't selected a player, show the character screen
        if (!this.props.character) {
            return <Character />;
        }

        // Otherwise show the game ui
        return (
            <div className="ui">
                <Row>
                    <Col className="left">
                        <CharacterCard character={this.props.character} />
                        <Location />
                        <Card>
                            <CardHeader>Character</CardHeader>
                            <CardBody>
                                <StatsMenu />
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
                                <li><a href="#" onClick={this.toggleEquipment}><FontAwesomeIcon icon="shield-alt" /> Equipment ({this.props.character.inventory.length}/{this.props.character.stats.inventorySize})</a></li>
                                <li><a href="#" onClick={this.toggleShop}><FontAwesomeIcon icon="shopping-cart" /> Shop (?)</a></li>
                                <li><a href="#"><FontAwesomeIcon icon="tasks" /> Quests (?)</a></li>
                                <li><a href="#"><FontAwesomeIcon icon="user-secret" /> Players (?)</a></li>
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
        );
    }

    render() {
        return (
            <React.Fragment>
                <div id="game">
                    {this.renderModals()}
                    {this.renderUI()}
                </div>
                {/* <Shop sendAction={this.sendAction} /> --- OLD SHOP */}
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
        character: state.character.selected,
        socket: state.app.socket,
        loggedIn: state.account.loggedIn,
        authToken: state.account.authToken,
        connection: {
            isConnected: state.app.connected,
            lastEvent: state.app.connectedEvent,
        },
    };
}

export default withRouter(connect(mapStateToProps, mapActionsToProps)(dragDropContext(HTML5Backend)(Game)));
