import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// UI
import {Table, Button} from 'reactstrap';

// Redux
import {togglePlayersMenu} from './actions';

class Players extends React.Component {
    constructor(props) {
        super(props);
    }

    doAction(command, set = false) {
        if (set) {
            return this.props.setCommand(command);
        }

        this.props.sendCommand(command);
    }

    render() {
        return (
            <Table striped size="sm">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Faction</th>
                        <th>-</th>
                        <th>-</th>
                        <th>-</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.props.players.map((player, index) => {
                            return (
                                <tr key={index}>
                                    <td>
                                        <div className="playerAvatar">
                                            <img src={player.profile_image} />
                                            {player.name}
                                        </div>
                                    </td>
                                    <td>{player.faction && player.faction.name || '-'}</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td className="text-right">
                                        <Button color="primary" size="sm" onClick={() => this.doAction(`/whisper ${player.name} `, true)}>Whisper</Button>
                                        {
                                            // Player is not in a faction
                                            !player.faction &&
                                            // Character is in a faction
                                            this.props.character.faction &&
                                            // Character is the faction leader
                                            this.props.character.faction.leader_id === this.props.character.user_id &&
                                            <Button color="primary" size="sm" onClick={() => this.doAction(`/factioninvite ${player.name}`)}>Invite</Button>
                                        }
                                        {
                                            // Player isn't the character playing
                                            player.user_id != this.props.character.user_id &&
                                            // Player is in a faction
                                            player.faction &&
                                            // Character is in a faction
                                            this.props.character.faction &&
                                            // Player and Character is in the same faction
                                            this.props.character.faction.faction_id === player.faction.faction_id &&
                                            // Character is the faction leader
                                            this.props.character.faction.leader_id === this.props.character.user_id &&
                                            <React.Fragment>
                                                <Button color="primary" size="sm" onClick={() => this.doAction(`/factionkick ${player.name}`)}>Kick</Button>
                                                <Button color="primary" size="sm" onClick={() => this.doAction(`/factionpromote ${player.name}`)}>Promote</Button>
                                            </React.Fragment>
                                        }
                                    </td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </Table>
        );
    }
}

function mapStateToProps(state) {
    return {
        players: [...state.game.players],
        character: state.character.selected,
        open: state.playersmenu.open,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        togglePlayersMenu,
    }, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(Players);
