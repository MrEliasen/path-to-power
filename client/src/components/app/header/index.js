import React from 'react';
import {withRouter, NavLink, Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import config from '../../../config';

// actions
import {authLogout} from '../../auth/actions';

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
            authButton = <button
                labelcolor="#ffffff"
                backgroundcolor="#6441A4"
                icon={<span />}
                onClick={this.logout.bind(this)}
            >Log Out</button>;
        } else {
            authButton = <a
                labelcolor="#ffffff"
                backgroundcolor="#6441A4"
                icon={twitchIcon}
                href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}
            >Login With Twitch</a>;
        }

        return (
            <div className="c-header__toolbar">
                {
                    !this.props.isConnected &&
                    <span text="Connecting.." />
                }
                {authButton}
                <a
                    href="https://github.com/MrEliasen/path-to-power/wiki"
                    target="_blank"
                >How To Play</a>
                <a
                    href={this.state.issueUrl}
                    target="_blank"
                >Report A Bug</a>
            </div>
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


    renderNavAuth() {
        if (this.props.character) {
            return (
                <React.Fragment>
                    <li><NavLink to="/game">Play</NavLink></li>
                    <li><NavLink to="/auth/settings">Settings</NavLink></li>
                    <li><NavLink to="/auth/logout" onClick={this.logout.bind(this)}>Logout</NavLink></li>
                </React.Fragment>
            );
        } else {
            return (
                <React.Fragment>
                    <li><NavLink exact to="/auth">Login</NavLink></li>
                    <li><NavLink to="/auth/register">Sign up</NavLink></li>
                </React.Fragment>
            );
        }
    }

    render() {
        return (
            <React.Fragment>
                <header id="header">
                    <div className="container">
                        <ul className="nav-pages">
                            <li><Link to="/" className="logo">Path To Power</Link></li>
                            <li><NavLink exact to="/">Home</NavLink></li>
                            <li><NavLink to="/page">The Game</NavLink></li>
                            <li><NavLink to="/about">About</NavLink></li>
                            <li><a href={this.state.issueUrl} target="_blank">Report a bug</a></li>
                            <li><Link to="/">Link</Link></li>
                            <li><Link to="/">Link</Link></li>
                            <li><Link to="/">Link</Link></li>
                            <li><Link to="/">Link</Link></li>
                        </ul>
                        <ul className="nav-auth">
                            {this.renderNavAuth()}
                        </ul>
                    </div>
                </header>
            </React.Fragment>
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
