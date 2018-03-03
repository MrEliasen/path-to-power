import React from 'react';
import ReactDOM from 'react-dom';

class ItemTooltip extends React.Component {
    constructor(props) {
        super(props);
        this.portalElement = document.createElement('div');
    }

    componentWillMount() {
        document.body.appendChild(this.portalElement);
    }

    componentWillUnmount() {
        document.body.removeChild(this.portalElement);
    }

    render() {
        if (! this.props.item) {
            return '';
        }

        return ReactDOM.createPortal(
            <div className="item-tooltip" style={{top: (this.props.coords.y + 10) + 'px', left: (this.props.coords.x + 10) + 'px'}}>
                <div className="name">{this.props.item.name}</div>
                <div className="count">Count: {this.props.item.count}</div>
            </div>
            , this.portalElement
        );
    }
}

export default ItemTooltip;
