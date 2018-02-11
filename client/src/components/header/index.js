import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import config from '../../config';
import loginImage from '../../assets/images/connect_dark.png';

// actions
import {authLogout} from '../auth/actions';

// UI
import {Toolbar, ToolbarGroup, ToolbarTitle} from 'material-ui/Toolbar';
import FlatButton from 'material-ui/FlatButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import Divider from 'material-ui/Divider';

class Header extends React.Component {
    constructor(props) {
        super(props);
    }

    logout() {
        Twitch.logout((error) => {
            localStorage.removeItem('account');
            this.props.authLogout();
            this.props.socket.close();
            this.props.history.push('/');
        });
    }

    render() {
        let authUrl = `https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`;

        return (
            <Toolbar>
                <ToolbarGroup>
                    <ToolbarTitle text="Path To Power" />
                </ToolbarGroup>
                <ToolbarGroup>
                    {
                        !this.props.character &&
                        <FlatButton href={authUrl} icon={<img src={loginImage} />}/>
                    }
                    {
                        this.props.character &&
                        <IconMenu
                            iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                            anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                            targetOrigin={{horizontal: 'right', vertical: 'top'}}
                        >
                            <MenuItem href="" primaryText="How To Play" />
                            <MenuItem href="https://github.com/MrEliasen/path-to-power-server/wiki" primaryText="Game Wiki" />
                            <MenuItem href="https://github.com/MrEliasen/path-to-power-server/issues" primaryText="Issues/Feedback" />
                            <Divider />
                            <MenuItem onClick={this.logout.bind(this)} primaryText="Log Out" />
                        </IconMenu>
                    }
                </ToolbarGroup>
            </Toolbar>
        );
    }
}

function mapStateToProps(state) {
    return {
        gamedata: {...state.game},
        character: state.character ? {...state.character} : null,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({authLogout}, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
