import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import config from '../../config';

// actions
import {authLogout} from '../auth/actions';

// UI
import {Toolbar, ToolbarGroup, ToolbarTitle} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import BugReportIcon from 'material-ui/svg-icons/action/bug-report';
import HelpIcon from 'material-ui/svg-icons/action/help';
import LogoutIcon from 'material-ui/svg-icons/action/exit-to-app';

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            issueUrl: 'https://github.com/MrEliasen/path-to-power/issues/new',
        };
    }

    componentWillMount() {
        this.generateIssueLink();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.character && !this.props.character) {
            this.generateIssueLink();
        }
    }

    goHome() {
        this.props.history.push('/');
    }

    logout() {
        Twitch.logout((error) => {
            localStorage.removeItem('account');
            this.props.authLogout();
            // this.props.socket.close();
            this.props.socket.emit('logout');
            this.goHome();
        });
    }

    renderToolbarButtons() {
        let authButton = null;
        let twitchIcon = <svg style={{width: '24px', height: '24px'}} viewBox="0 0 24 24"><path fill="#ffffff" d="M4,2H22V14L17,19H13L10,22H7V19H2V6L4,2M20,13V4H6V16H9V19L12,16H17L20,13M15,7H17V12H15V7M12,7V12H10V7H12Z" /></svg>;
        if (this.props.character) {
            authButton = <RaisedButton
                label="Log Out"
                labelColor="#ffffff"
                backgroundColor="#6441A4"
                icon={<LogoutIcon />}
                onClick={this.logout.bind(this)}
            />;
        } else {
            authButton = <RaisedButton
                label="Login With Twitch"
                labelColor="#ffffff"
                backgroundColor="#6441A4"
                icon={twitchIcon}
                href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}
            />;
        }

        return (
            <ToolbarGroup className="c-header__toolbar">
                {
                    !this.props.isConnected &&
                    <ToolbarTitle text="Connecting.." />
                }
                {authButton}
                <RaisedButton
                    label="How To Play"
                    icon={<HelpIcon />}
                    primary={true}
                    href="https://github.com/MrEliasen/path-to-power/wiki"
                    target="_blank"
                />
                <RaisedButton
                    label="Report A Bug"
                    icon={<BugReportIcon />}
                    secondary={true}
                    href={this.state.issueUrl}
                    target="_blank"
                />
            </ToolbarGroup>
        );
    }

    generateIssueLink() {
        fetch('https://raw.githubusercontent.com/MrEliasen/path-to-power/master/.github/ISSUE_TEMPLATE.md')
            .then((response) => response.text())
            .then((text) => {
                // replace static information
                text = text.replace('**Operating System**:', `**Operating System**: ${window.navigator.platform}`);
                text = text.replace('**Browser/Version**:', `**Browser/Version**: ${window.navigator.userAgent}`);

                if (this.props.character) {
                    text = text.replace('**In-Game Name**: (if applicable)', `**In-Game Name**: ${this.props.character.name}`);
                }

                this.setState({
                    issueUrl: `https://github.com/MrEliasen/path-to-power/issues/new?body=${encodeURIComponent(text)}`,
                });
            })
            .catch((err) => {
            });
    }

    render() {
        return (
            <Toolbar className="c-header">
                <ToolbarGroup>
                    <a onClick={this.goHome.bind(this)}>
                        <ToolbarTitle text="Path To Power" style={{color: 'inherit'}} />
                    </a>
                </ToolbarGroup>
                {this.renderToolbarButtons()}
            </Toolbar>
        );
    }
}

function mapStateToProps(state) {
    return {
        gamedata: {...state.game},
        character: state.character ? {...state.character} : null,
        isConnected: state.app.connected,
        socket: state.app.socket,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({authLogout}, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));
