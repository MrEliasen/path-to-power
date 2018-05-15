import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// Components
import Inventory from '../inventory';
import Stats from './stats';
import Players from '../players';
import EquippedSlot from '../item/equippedslot';
import SkillsModal from '../skills';
import UpgradesModal from '../upgrades';

// actions
import {togglePlayersMenu} from '../players/actions';

// UI
import {Card, Modal, ModalHeader, ModalBody, Row, Col} from 'reactstrap';
import Icon from '@fortawesome/react-fontawesome';

class CharacterMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modalEquipment: false,
            modalStats: false,
            modalQuests: false,
            modalPlayers: false,
            modalSkills: false,
            modalUpgrades: false,
        };

        // this.mapSearch = this.mapSearch.bind(this);
        this.toggleEquipment = this.toggleEquipment.bind(this);
        this.toggleStats = this.toggleStats.bind(this);
        this.toggleQuests = this.toggleQuests.bind(this);
        this.togglePlayers = this.togglePlayers.bind(this);
        this.toggleSkills = this.toggleSkills.bind(this);
        this.toggleUpgrades = this.toggleUpgrades.bind(this);
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

    toggleSkills() {
        this.setState({modalSkills: !this.state.modalSkills});
    }

    toggleUpgrades() {
        this.setState({modalUpgrades: !this.state.modalUpgrades});
    }

    togglePlayers() {
        this.props.togglePlayersMenu();
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
                                    <EquippedSlot inventorySlot="weapon-ranged" title="Ranged Weapon" />
                                    <EquippedSlot inventorySlot="weapon-melee" title="Melee Weapon" />
                                    <EquippedSlot inventorySlot="armour-body" title="Body Armour" />
                                    <EquippedSlot inventorySlot="weapon-ammo" title="Ammunition" />
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
                        <Stats />
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalQuests} toggle={this.toggleQuests} size="lg">
                    <ModalHeader toggle={this.toggleQuests}>Quests</ModalHeader>
                    <ModalBody>
                        Not yet :(
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.props.playersMenuOpen} toggle={this.togglePlayers} size="lg">
                    <ModalHeader toggle={this.togglePlayers}>Players Online</ModalHeader>
                    <ModalBody>
                        <Players setCommand={this.props.setCommand} sendCommand={this.props.sendCommand} />
                    </ModalBody>
                </Modal>
                <SkillsModal visible={this.state.modalSkills} toggleMethod={this.toggleSkills} />
                <UpgradesModal visible={this.state.modalUpgrades} toggleMethod={this.toggleUpgrades} />
            </React.Fragment>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderModals()}
                <Card className="menu menu-character">
                    <a href="#" onClick={this.toggleEquipment}><Icon icon="shield-alt" /> Equipment ({this.props.character.inventory.length}/{this.props.character.stats.inventorySize})</a>
                    <a href="#" onClick={this.toggleStats}><Icon icon="chart-bar" /> Stats</a>
                    <a href="#" onClick={this.toggleSkills}><Icon icon="cubes" /> Skills</a>
                    <a href="#" onClick={this.toggleUpgrades}><Icon icon="ellipsis-h" /> Upgrades</a>
                    {/* <a href="#" onClick={this.toggleQuests}><Icon icon="tasks" /> Quests (?)</a> */}
                    <a href="#" onClick={this.togglePlayers}><Icon icon="user-secret" /> Players ({this.props.players.length})</a>
                    {/* <a href="#" onClick={this.mapSearch}><Icon icon="map-marker-alt" /> Map</a> */}
                </Card>
            </React.Fragment>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        togglePlayersMenu,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        players: state.game.players,
        character: state.character.selected,
        playersMenuOpen: state.playersmenu.open,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(CharacterMenu);
