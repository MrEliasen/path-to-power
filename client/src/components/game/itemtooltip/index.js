import React from 'react';
import ReactDOM from 'react-dom';

class ItemTooltip extends React.Component {
    constructor(props) {
        super(props);

        this.item = this.props.item;
        this.elm = document.createElement('div');
    }

    componentWillMount() {
        console.log(this.props.coords);
        document.body.appendChild(this.elm);
    }

    componentWillUnmount() {
        document.body.removeChild(this.elm);
    }

    render() {
        if (! this.item) {
            return '';
        }

        return ReactDOM.createPortal(
            <div className="item-tooltip" style={{top: (this.props.coords.y + 10) + 'px', left: (this.props.coords.x + 10) + 'px'}}>
                <div className="name">{this.item.name}</div>
                <div className="count">Count: {this.item.count}</div>
            </div>
            , this.elm
        );
    }
}

export default ItemTooltip;
