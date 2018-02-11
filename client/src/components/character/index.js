import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';

// UI
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

// actions
import {createCharacter} from './actions';

class Character extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      city: '',
    };
  }

  componentWillMount() {
    if (!Twitch.getToken()) {
      return this.props.history.push('/auth');
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.characterLoaded) {
      return this.props.history.push('/game');
    }
  }

  signup() {
    this.props.socket.emit('dispatch', createCharacter({
      location: this.state.city,
    }));
  }

  render() {
    return (
      <div className="c-character">
        <Paper zDepth={1} rounded={true} className="__form">
          <h3>Create Character</h3>

          <SelectField
            fullWidth={true}
            onChange={(event, key, payload) => {
              this.setState({city: payload});
            }}
            value={this.state.city}
            floatingLabelText="Select Start City"
            floatingLabelStyle={{color: '#FF9800'}}
            floatingLabelFocusStyle={{color: '#2196F3'}}
          >
            {
              Object.keys(this.props.game.maps).map((mapId) =>
                <MenuItem
                  key={mapId}
                  value={mapId}
                  primaryText={this.props.game.maps[mapId].name}
                />
              )
            }
          </SelectField>

          {
            this.props.error &&
            <p>{this.props.error}</p>
          }

          <RaisedButton
            onClick={this.signup.bind(this)}
            label="Create Character"
            primary={true}
            fullWidth={true}
          />
        </Paper>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    characterLoaded: state.character ? true : false,
    game: {...state.game},
    error: state.auth ? state.auth.message : null,
  };
}

export default withRouter(connect(mapStateToProps)(Character));
