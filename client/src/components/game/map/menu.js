import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {newEvent} from '../events/actions';

// UI
import {Card, Modal, ModalHeader, ModalBody} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

class MapMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modalItems: false,
            modalPlayers: false,
            modalNPCs: false,
        };

        this.showStructureInfo = this.showStructureInfo.bind(this);
        this.toggleItems = this.toggleItems.bind(this);
        this.togglePlayers = this.togglePlayers.bind(this);
        this.toggleNPCs = this.toggleNPCs.bind(this);
    }

    // TODO: Modal?
    showStructureInfo(structure) {
        this.props.newEvent({
            type: 'structure-info',
            structure: structure,
        });
    }

    toggleItems() {
        this.setState({modalItems: !this.state.modalItems});
    }

    togglePlayers() {
        this.setState({modalPlayers: !this.state.modalPlayers});
    }

    toggleNPCs() {
        this.setState({modalNPCs: !this.state.modalNPCs});
    }

    renderModals() {
        return (
            <React.Fragment>
                <Modal isOpen={this.state.modalItems} toggle={this.toggleItems} size="lg">
                    <ModalHeader toggle={this.toggleItems}>Items</ModalHeader>
                    <ModalBody>
                        {
                            this.props.map.items.map((item, index) => {
                                if (item) {
                                    const itemObj = this.props.itemlist[item.id];

                                    return <React.Fragment key={index}>
                                        {
                                            index !== 0 &&
                                            <span>, </span>
                                        }
                                        {(itemObj.stats.stackable ? `(${item.durability}) ` : '')}{itemObj.name}
                                    </React.Fragment>;
                                }
                            })
                        }
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalPlayers} toggle={this.togglePlayers} size="lg">
                    <ModalHeader toggle={this.togglePlayers}>Players</ModalHeader>
                    <ModalBody>
                        {
                            this.props.map.players.map((user, index) =>
                                <React.Fragment key={user.user_id}>
                                    {
                                        index !== 0 &&
                                        <span>, </span>
                                    }
                                    <span>
                                        {user.name}
                                    </span>
                                </React.Fragment>
                            )
                        }
                    </ModalBody>
                </Modal>
                <Modal isOpen={this.state.modalNPCs} toggle={this.toggleNPCs} size="lg">
                    <ModalHeader toggle={this.toggleNPCs}>NPCs</ModalHeader>
                    <ModalBody>
                        {
                            this.props.map.npcs.map((NPC, index) =>
                                <React.Fragment key={index}>
                                    {
                                        index !== 0 &&
                                        <span>, </span>
                                    }
                                    <span>
                                        {NPC.name} the {NPC.type} (HP: {NPC.health})
                                    </span>
                                </React.Fragment>
                            )
                        }
                    </ModalBody>
                </Modal>
            </React.Fragment>
        );
    }

    render() {
        const total = this.props.map.structures.length + this.props.map.items.length + this.props.map.players.length + this.props.map.npcs.length;
        if (total === 0) {
            return '';
        }

        return (
            <React.Fragment>
                {this.renderModals()}
                <div className="text-center">
                    <Card className="menu menu-map">
                        {
                            this.props.map.structures.length > 0 &&
                            this.props.map.structures.map((structure, index) => {
                                return <a
                                    key={index}
                                    href="#"
                                    style={{color: structure.colour}}
                                    onClick={() => this.showStructureInfo(structure)}
                                >
                                    <FontAwesomeIcon icon="building" /> {structure.name}
                                </a>;
                            })
                        }
                        {
                            this.props.map.items.length > 0 &&
                            <a href="#" onClick={this.toggleItems}><FontAwesomeIcon icon="shield" /> Items ({this.props.map.items.length})</a>
                        }
                        {
                            this.props.map.players.length > 0 &&
                            <a href="#" onClick={this.togglePlayers}><FontAwesomeIcon icon="user-secret" /> Players ({this.props.map.players.length})</a>
                        }
                        {
                            this.props.map.npcs.length > 0 &&
                            <a href="#" onClick={this.toggleNPCs}><FontAwesomeIcon icon="user-secret" /> NPCs ({this.props.map.npcs.length})</a>
                        }
                    </Card>
                </div>
            </React.Fragment>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        newEvent,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        map: {...state.map},
        maps: {...state.game.maps},
        character: state.character.selected,
    };
}

export default connect(mapStateToProps, mapActionsToProps)(MapMenu);
