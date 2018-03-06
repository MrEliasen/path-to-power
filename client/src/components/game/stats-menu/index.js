import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleStatsMenu} from './actions';

class StatsMenu extends React.Component {
    render() {
        if (!this.props.character) {
            return null;
        }
        const styles = {
            info: {
                fontSize: '14px',
                padding: '2px 16px',
                margin: '0px',
            },
        };

        return (
            <div>
                <div>Stats</div>
                <p style={styles.info}><strong>Health:</strong> {this.props.character.stats.health}/{this.props.character.stats.health_max}</p>
                <p style={styles.info}><strong>Cash:</strong> {this.props.character.stats.money}</p>
                <p style={styles.info}><strong>Bank:</strong> {this.props.character.stats.bank}</p>
                <div className="divider"/>
                <div>Abilities</div>
                {
                    Object.keys(this.props.character.abilities).map((key) =>
                        <p style={styles.info} key={key}><strong>{this.props.character.abilities[key].name}:</strong> {this.props.character.abilities[key].value}</p>
                    )
                }
                <div className="divider"/>
                <div>Skills</div>
                {
                    Object.keys(this.props.character.skills).map((key) =>
                        <p style={styles.info} key={key}><strong>{this.props.character.skills[key].name}:</strong> {this.props.character.skills[key].modifiers.value}</p>
                    )
                }
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        character: state.character.selected,
        open: state.statsmenu.open,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        toggleStatsMenu,
    }, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(StatsMenu);
