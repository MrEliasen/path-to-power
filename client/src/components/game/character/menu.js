import React from 'react';
import {connect} from 'react-redux';

// Components
import Inventory from '../inventory';
import StatsMenu from '../stats-menu';
import Players from '../players';
import ItemSlot from '../item/slot';

// UI
import {Card, Modal, ModalHeader, ModalBody, Row, Col} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

class CharacterMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modalEquipment: false,
            modalStats: false,
            modalQuests: false,
            modalPlayers: false,
        };

        // this.mapSearch = this.mapSearch.bind(this);
        this.toggleEquipment = this.toggleEquipment.bind(this);
        this.toggleStats = this.toggleStats.bind(this);
        this.toggleQuests = this.toggleQuests.bind(this);
        this.togglePlayers = this.togglePlayers.bind(this);
    }

    // TODO: Move this to the map component
    // mapSearch() {
    //     this.props.newEvent({
    //         type: 'multiline',
    //         message: [
    //             'Map Locations:',
    //             '----------------',
    //         ].concat(this.props.structures.map((obj) => {
    //             return `The ${obj.name} can be found at North ${obj.location.y} / East ${obj.location.x}`;
    //         })),
    //     });
    // }

    toggleEquipment() {
        this.setState({modalEquipment: !this.state.modalEquipment});
    }

    toggleStats() {
        this.setState({modalStats: !this.state.modalStats});
    }

    toggleQuests() {
        this.setState({modalQuests: !this.state.modalQuests});
    }

    togglePlayers() {
        this.setState({modalPlayers: !this.state.modalPlayers});
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
                <Modal isOpen={this.state.modalStats} toggle={this.toggleStats} size="lg">
                    <ModalHeader toggle={this.toggleStats}>Stats</ModalHeader>
                    <ModalBody>
                        <StatsMenu />
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalQuests} toggle={this.toggleQuests} size="lg">
                    <ModalHeader toggle={this.toggleQuests}>Quests</ModalHeader>
                    <ModalBody>
                        Not yet :(
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalPlayers} toggle={this.togglePlayers} size="lg">
                    <ModalHeader toggle={this.togglePlayers}>Players Online</ModalHeader>
                    <ModalBody>
                        <Players />
                    </ModalBody>
                </Modal>
            </React.Fragment>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderModals()}
                <Card className="menu menu-character">
                    <a href="#" onClick={this.toggleEquipment}><FontAwesomeIcon icon="shield-alt" /> Equipment ({this.props.character.inventory.length}/{this.props.character.stats.inventorySize})</a>
                    <a href="#" onClick={this.toggleStats}><FontAwesomeIcon icon="chart-bar" /> Stats</a>
                    <a href="#" onClick={this.toggleQuests}><FontAwesomeIcon icon="tasks" /> Quests (?)</a>
                    <a href="#" onClick={this.togglePlayers}><FontAwesomeIcon icon="user-secret" /> Players ({this.props.players.length})</a>
                    {/* <a href="#" onClick={this.mapSearch}><FontAwesomeIcon icon="map-marker-alt" /> Map</a> */}
                </Card>
            </React.Fragment>
        );
    }
}

function mapStateToProps(state) {
    return {
        players: state.game.players,
        character: state.character.selected,
    };
}

export default connect(mapStateToProps)(CharacterMenu);
