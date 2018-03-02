import React from 'react';
import ItemTooltip from '../itemtooltip';

class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showTooltip: false,
        };

        this.item = this.props.item;
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    onMouseEnter(e) {
        this.setState({showTooltip: {
            x: e.pageX,
            y: e.pageY,
        }});
    }

    onMouseLeave(e) {
        this.setState({showTooltip: false});
    }

    onMouseMove(e) {
        this.setState({showTooltip: {
            x: e.pageX,
            y: e.pageY,
        }});
    }

    render() {
        if (! this.item) {
            return '';
        }

        return (
            <div className="item" onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} onMouseMove={this.onMouseMove}>
                {
                    this.state.showTooltip && <ItemTooltip item={this.item} coords={this.state.showTooltip} />
                }
                <div className="item-layer item-name"><span>{this.item.name}</span></div>
                {
                    this.item.count > 1 &&
                    <div className="item-layer item-count"><span>{this.item.count}</span></div>
                }
            </div>
        );
    }
}

export default Item;
