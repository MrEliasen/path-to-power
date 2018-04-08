import React from 'react';
import {connect} from 'react-redux';

class Stats extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <p><strong>Health:</strong> {this.props.character.stats.health}/{this.props.character.stats.health_max}</p>
                <p><strong>Cash:</strong> {this.props.character.stats.money}</p>
                <p><strong>Bank:</strong> {this.props.character.stats.bank}</p>
                <div>Abilities</div>
                {
                    Object.keys(this.props.character.abilities).map((key) =>
                        <p key={key}><strong>{this.props.character.abilities[key].name}:</strong> {this.props.character.abilities[key].value}</p>
                    )
                }
                <div>Skills</div>
                {
                    Object.keys(this.props.character.skills).map((key) =>
                        <p key={key}><strong>{this.props.character.skills[key].name}:</strong> {this.props.character.skills[key].modifiers.value}</p>
                    )
                }
            </React.Fragment>
        );
    }
}

function mapStateToProps(state) {
    return {
        character: state.character.selected,
    };
}

export default connect(mapStateToProps)(Stats);
