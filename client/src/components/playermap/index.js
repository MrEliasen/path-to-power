import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {newEvent} from '../events/actions';

class PlayerMap extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sidebar: 'players',
            command: '',
        };

        this.showStructureInfo = this.showStructureInfo.bind(this);
    }

    showStructureInfo(structure) {
        this.props.newEvent({
            type: 'structure-info',
            structure: structure,
        });
    }

    render() {
        // if the character is not load, dont continue
        if (!this.props.character) {
            return null;
        }

        const location = this.props.location;
        const hasPlayers = location.players.length ? true : false;
        const hasItems = location.items.length ? true : false;
        const hasStructures = location.structures.length ? true : false;
        const hasNPCs = location.npcs.length ? true : false;

        return (
            <React.Fragment>
                <strong>Location:</strong> {this.props.maps[this.props.character.location.map].name}<br />
                <strong>Compass:</strong> North {this.props.character.location.y} / East {this.props.character.location.x}<br/>
                "{location.description}"<br/>
                <div className="c-game__event-divider" />
                {
                    hasStructures &&
                    <React.Fragment>
                        <strong className="infoheader">Buildings</strong>
                        <p>
                            {
                                location.structures.map((structure, index) =>
                                    <React.Fragment key={index}>
                                        {
                                            index !== 0 &&
                                            <span>, </span>
                                        }
                                        <span
                                            className="e-clickable"
                                            style={{color: structure.colour}}
                                            onClick={() => this.showStructureInfo(structure)}
                                        >
                                            {structure.name}
                                        </span>
                                    </React.Fragment>
                                )
                            }
                        </p>
                    </React.Fragment>
                }
                {
                    hasPlayers &&
                    <React.Fragment>
                        <strong className="infoheader">Players</strong>
                        <p>
                            {
                                location.players.map((user, index) =>
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
                        </p>
                    </React.Fragment>
                }
                {
                    hasNPCs &&
                    <React.Fragment>
                        <strong className="infoheader">NPCs</strong>
                        <p>
                            {
                                location.npcs.map((NPC, index) =>
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
                        </p>
                    </React.Fragment>
                }
                {
                    hasItems &&
                    <React.Fragment>
                        <strong className="infoheader">Items on the ground</strong>
                        <p>
                            {
                                location.items.map((item, index) => {
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
                        </p>
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
}

function mapStateToProps(state) {
    return {
        maps: {...state.game.maps},
        location: {...state.map},
        itemlist: {...state.game.items},
        character: state.character ? {...state.character} : null,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({newEvent}, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(PlayerMap);
