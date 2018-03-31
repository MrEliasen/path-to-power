import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {newEvent} from '../events/actions';
import {Card, CardBody, CardHeader} from 'reactstrap';
import classnames from 'classnames';
import {getStringColour} from '../../../helper';

class Map extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sidebar: 'players',
            command: '',
        };
    }

    renderGrid() {
        let grid = [];
        let buildings = {};
        let map = this.props.maps[this.props.character.location.map];

        if (typeof map === 'undefined') {
            return grid;
        }

        // Let's cache the buildings array here to avoid affecting performance inside the nested loop
        map.buildings.map((building) => {
            buildings[building.location.x + '-' + building.location.y] = building.colour;
        });

        for (let y = 0; y <= map.gridSize.y; y++) {
            let cells = [];
            for (let x = 0; x <= map.gridSize.x; x++) {
                let cellId = x + '-' + y;
                let classes = ['x'];
                let styles = {};

                // If this location has a building
                if (typeof buildings[cellId] !== 'undefined') {
                    classes.push('b');
                    Object.assign(styles, {
                        backgroundColor: buildings[cellId],
                    });
                }

                // If character is on this location
                if (this.props.character.location.x == x && this.props.character.location.y == y) {
                    classes.push('c');
                    Object.assign(styles, {
                        'backgroundColor': getStringColour(this.props.character.name),
                    });
                }

                cells.push(<div key={cellId} className={classnames(classes)} style={styles} />);
            }
            grid.push(<div key={y} className="y">{cells}</div>);
        }

        return grid;
    }

    render() {
        return (
            <Card>
                <CardHeader>
                    <div className="float-right">
                        N {this.props.character.location.y} : E {this.props.character.location.x}
                    </div>
                    {this.props.maps[this.props.character.location.map].name}
                </CardHeader>
                <div id="map">
                    {this.renderGrid()}
                </div>
                <CardBody>
                    {this.props.map.description}
                </CardBody>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        maps: {...state.game.maps},
        map: {...state.map},
        itemlist: {...state.game.items},
        character: state.character.selected,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({newEvent}, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(Map);
