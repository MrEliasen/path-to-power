import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleStatsMenu} from './actions';

// UI
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

// drawer header
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';

class StatsMenu extends React.Component {
    render() {
        if (!this.props.character) {
            return null;
        }
        const styles = {
            info: {
                fontSize: '14px',
                padding: '7px 16px',
                margin: '0px',
            },
        };

        return (
            <Drawer
                width={300}
                openSecondary={true}
                open={this.props.open}
                docked={false}
                onRequestChange={this.props.toggleStatsMenu}
            >
                <AppBar
                    title="Character Stats"
                    iconElementLeft={
                        <IconButton onClick={this.props.toggleStatsMenu}>
                            <NavigationClose />
                        </IconButton>
                    }
                />
                <Divider/>
                <Subheader>Stats</Subheader>
                <p style={styles.info}><strong>Health:</strong> {this.props.character.stats.health}/{this.props.character.stats.health_max}</p>
                <p style={styles.info}><strong>Cash:</strong> {this.props.character.stats.money}</p>
                <p style={styles.info}><strong>Bank:</strong> {this.props.character.stats.bank}</p>
                <Divider/>
                <Subheader>Abilities</Subheader>
                {
                    Object.keys(this.props.character.abilities).map((key) =>
                        <p style={styles.info} key={key}><strong>{this.props.character.abilities[key].name}:</strong> {this.props.character.abilities[key].value}</p>
                    )
                }
                <Divider/>
                <Subheader>Skills</Subheader>
                {
                    Object.keys(this.props.character.skills).map((key) =>
                        <p style={styles.info} key={key}><strong>{this.props.character.skills[key].name}:</strong> {this.props.character.skills[key].modifiers.value}</p>
                    )
                }
            </Drawer>
        );
    }
}

function mapStateToProps(state) {
    return {
        character: state.character ? {...state.character} : null,
        open: state.statsmenu.open,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        toggleStatsMenu,
    }, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(StatsMenu);
