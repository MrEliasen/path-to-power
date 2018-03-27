import React from 'react';
import ReactDOM from 'react-dom';

class ItemTooltip extends React.Component {
    constructor(props) {
        super(props);
        this.portalElement = document.createElement('div');
    }

    generateDescription(item) {
        let description = item.description;

        if (item.stats) {
            Object.keys(item.stats).map((key) => {
                if (typeof item.stats[key] !== 'object') {
                    const exp = new RegExp(`({${key}})+`, 'gi');
                    description = description.replace(exp, item.stats[key]);
                }
            });
        }

        return description;
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
                <div className="description">{this.generateDescription(this.props.item)}</div>
                <div className="stats">
                    {
                        this.props.item.stats &&
                        Object.keys(this.props.item.stats).map((key, index) => {
                            if (typeof this.props.item.stats[key] !== 'object') {
                                return <div key={index}>{key}: {this.props.item.stats[key]}</div>;
                            }
                        })
                    }
                </div>
                {
                    this.props.item.count &&
                    <div className="count">Count: {this.props.item.count}</div>
                }
            </div>
            , this.portalElement
        );
    }
}

export default ItemTooltip;
