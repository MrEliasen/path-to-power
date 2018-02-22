import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {togglePlayersMenu} from './actions';

class PlayersMenu extends React.Component {
    constructor() {
        super();

        this.renderContextMenu = this.renderContextMenu.bind(this);
    }

    doAction(command, set = false) {
        this.props.togglePlayersMenu();

        if (set) {
            return this.props.setCommand(command);
        }

        this.props.sendCommand(command);
    }

    renderContextMenu(player) {
        return (
            <div spanElement={<span><span/></span>}>
                <div onClick={() => this.doAction(`/whisper ${player.name} `, true)}>Whisper</div>
                {
                    !player.faction &&
                    this.props.character.faction &&
                    this.props.character.faction.leader_id === this.props.character.user_id &&
                    <div onClick={() => this.doAction(`/factioninvite ${player.name}`)}>Invite To Faction</div>
                }
                {
                    // have a faction
                    player.faction &&
                    // and the character have a faction
                    this.props.character.faction &&
                    // and they are in the same faction
                    this.props.character.faction.faction_id === player.faction.faction_id &&
                    // and the character is the leader
                    this.props.character.faction.leader_id === this.props.character.user_id &&
                    <React.Fragment>
                        <div className="divider" />
                        <div onClick={() => this.doAction(`/factionkick ${player.name}`)}>Kick Member</div>
                        <div onClick={() => this.doAction(`/factionpromote ${player.name}`)}>Promote To Leader</div>
                    </React.Fragment>
                }
            </div>
        );
    }

    render() {
        return (
            <div
            >
                <div>Online Players</div>
                <div className="divider"/>
                <div>Players Online</div>
                {
                    this.props.players &&
                    this.props.players.map((player) =>
                        <React.Fragment key={player.user_id}>
                            <div>{<img src={player.profile_image} />}{player.name}<br />{(player.faction ? `Faction: ${player.faction.name}` : '')}</div>
                            <div className="divider" />
                        </React.Fragment>
                    )
                }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        players: [...state.game.players],
        character: state.character ? {...state.character} : null,
        open: state.playersmenu.open,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        togglePlayersMenu,
    }, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(PlayersMenu);
