import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {newEvent} from '../events/actions';

// UI
import {
    Card,
    Modal,
    ModalHeader,
    ModalBody,
} from 'reactstrap';
import Icon from '@fortawesome/react-fontawesome';

// components
import Structure from './structure';
import NPCs from './npcs';

class MapMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modalItems: false,
            modalPlayers: false,
            modalNPCs: false,
        };

        this.toggleItems = this.toggleItems.bind(this);
        this.togglePlayers = this.togglePlayers.bind(this);
        this.toggleNPCs = this.toggleNPCs.bind(this);
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
                                    const itemObj = this.props.itemList[item.id];

                                    if (!itemObj) {
                                        return null;
                                    }

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
                    <Card className="menu menu-map cluster">
                        {
                            this.props.map.structures.length > 0 &&
                            this.props.map.structures.map((structure, index) => {
                                return <Structure key={index} structure={structure} />;
                            })
                        }
                    </Card>
                    {
                        this.props.map.items.length > 0 &&
                        <Card className="menu menu-map cluster">
                            <a href="#" onClick={this.toggleItems}><Icon icon="shield" /> Items ({this.props.map.items.length})</a>
                        </Card>
                    }
                    {
                        this.props.map.players.length > 0 &&
                        <Card className="menu menu-map cluster">
                            <a href="#" onClick={this.togglePlayers}><Icon icon="user-secret" /> Players ({this.props.map.players.length})</a>
                        </Card>
                    }
                    {
                        this.props.map.npcs.length > 0 &&
                        <Card className="menu menu-map cluster">
                            <NPCs list={this.props.map.npcs} onClick={this.toggleNPCs} />
                        </Card>
                    }
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
        itemList: state.game.items || {},
    };
}

export default connect(mapStateToProps, mapActionsToProps)(MapMenu);
