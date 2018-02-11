import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {togglePlayersMenu} from './actions';

// UI
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import {ListItem} from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import IconMenu from 'material-ui/IconMenu';
// drawer header
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';


// icons
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

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
            <IconMenu iconButtonElement={<IconButton><MoreVertIcon/></IconButton>}>
                <MenuItem onClick={() => this.doAction(`/whisper ${player.name} `, true)}>Whisper</MenuItem>
                {
                    !player.faction &&
                    this.props.character.faction &&
                    this.props.character.faction.leader_id === this.props.character.user_id &&
                    <MenuItem onClick={() => this.doAction(`/factioninvite ${player.name}`)}>Invite To Faction</MenuItem>
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
                        <Divider />
                        <MenuItem onClick={() => this.doAction(`/factionkick ${player.name}`)}>Kick Member</MenuItem>
                        <MenuItem onClick={() => this.doAction(`/factionpromote ${player.name}`)}>Promote To Leader</MenuItem>
                    </React.Fragment>
                }
            </IconMenu>
        );
    }

    render() {
        return (
            <Drawer
                width={300}
                openSecondary={true}
                open={this.props.open}
                docked={false}
                onRequestChange={this.props.togglePlayersMenu}
            >
                <AppBar
                    title="Online Players"
                    iconElementLeft={
                        <IconButton onClick={this.props.togglePlayersMenu}>
                            <NavigationClose />
                        </IconButton>
                    }
                />
                <Divider/>
                <Subheader>Players Online</Subheader>
                {
                    this.props.players &&
                    this.props.players.map((player) =>
                        <React.Fragment key={player.user_id}>
                            <ListItem
                                primaryText={player.name}
                                secondaryText={(player.faction ? `Faction: ${player.faction.name}` : '')}
                                leftAvatar={<Avatar src={player.profile_image} />}
                                rightIconButton={(player.user_id !== this.props.character.user_id ? this.renderContextMenu(player) : null)}
                            />
                            <Divider />
                        </React.Fragment>
                    )
                }
            </Drawer>
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
