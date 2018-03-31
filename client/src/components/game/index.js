import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import HTML5Backend from 'react-dnd-html5-backend';
import {DragDropContext as dragDropContext} from 'react-dnd';

import Events from './events';
import GameMap from './map';
import MapMenu from './map/menu';

import {clearEvents, newEvent} from './events/actions';
import {newCommand, gameLogout} from './actions';
import {moveCharacter} from './character/actions';
import {socketSend} from '../app/actions';

// Components
import {Container, Row, Col, Input, InputGroup, InputGroupAddon, Button, Form} from 'reactstrap';
import Chat from './chat';
import Character from './character';
import CharacterCard from './character/card';
import CharacterMenu from './character/menu';
import CharacterCombatMenu from './character/combat';
import Shop from './shop';

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
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }

        document.addEventListener('keydown', this.onKeyPress.bind(this));
    }

    componentWillUnmount() {
        this.props.gameLogout();

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
        // User isn't playing a character, ABORT!
        if (!this.props.character) {
            return;
        }

        // User is typing something, ABORT!
        if (document.activeElement.value) {
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                this.movePosition(e);
                break;

            case '/':
                document.querySelector('#input-command').focus();
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
        this.props.socketSend(action);
    }

    sendCommand(command = null) {
        command = command || {...this.state}.command;

        if (command.length === 0) {
            this.props.newEvent('Please enter a command!');
        } else if (command.toLowerCase() === '/clear') {
            this.props.clearEvents();
        } else if (['/commandlist', '/commands'].includes(command.toLowerCase())) {
            this.props.newEvent({
                type: 'commandlist',
                message: '',
            });
        } else {
            this.props.newCommand(command);
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

    onSubmit(e) {
        e.preventDefault();
        this.sendCommand();
        document.querySelector('#input-command').focus();
    }

    renderUI() {
        // If the user hasn't selected a player, show the character screen
        if (!this.props.character) {
            return <Character />;
        }

        // Otherwise show the game ui
        return (
            <div className="ui">
                <Container>
                <Row>
                    <Col className="left">
                        <CharacterCard character={this.props.character} />
                        <GameMap />
                        <MapMenu />
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
                    <Col sm="9" className="middle">
                        <CharacterMenu setCommand={this.setCommand} sendCommand={this.sendCommand} />
                        <Chat setCommand={this.setCommand} title="Chat" messages={this.props.chat} lines="10" />
                        <Events />
                        <CharacterCombatMenu />
                        <Form onSubmit={this.onSubmit}>
                            <InputGroup>
                                <Input
                                    id="input-command"
                                    onChange={(e) => {
                                        this.setState({command: e.target.value});
                                    }}
                                    value={this.state.command}
                                    placeholder="Type your commands here, and hit Enter."
                                    type="input"
                                    name="input"
                                />
                                <InputGroupAddon addonType="append"><Button color="primary">Send</Button></InputGroupAddon>
                            </InputGroup>
                        </Form>
                    </Col>
                </Row>
                </Container>
            </div>
        );
    }

    render() {
        return (
            <React.Fragment>
                <div id="game">
                    {this.renderUI()}
                    <Shop />
                </div>
            </React.Fragment>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        clearEvents,
        newEvent,
        socketSend,
        newCommand,
        gameLogout,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        game: {...state.game},
        character: state.character.selected,
        players: state.game.players,
        chat: state.game.chat,
        events: state.events,
        socket: state.app.socket,
        loggedIn: state.account.loggedIn,
        authToken: state.account.authToken,
        structures: state.character.selected ? [
            ...state.game.maps[state.character.selected.location.map].buildings,
        ] : null,
        connection: {
            isConnected: state.app.connected,
            lastEvent: state.app.connectedEvent,
        },
    };
}

export default withRouter(connect(mapStateToProps, mapActionsToProps)(dragDropContext(HTML5Backend)(Game)));
