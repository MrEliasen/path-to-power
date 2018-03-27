import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {DragSource as dragSource} from 'react-dnd';
import ItemTooltip from '../item/tooltip';

// actions
import {buyItem} from './actions';

class Item extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mousePosition: {x: 0, y: 0},
            showTooltip: false,
        };

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    // Show tooltip
    onMouseEnter(e) {
        this.setState({showTooltip: true});
    }

    // Hide tooltip
    onMouseLeave(e) {
        this.setState({showTooltip: false});
    }

    // Save mouse position for the tooltip
    onMouseMove(e) {
        this.setState({
            mousePosition: {x: e.pageX, y: e.pageY},
        });
    }

    render() {
        const {isDragging, connectDragSource} = this.props;

        return connectDragSource(
            <div
                className={'item' + (isDragging ? ' dragging' : '')}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
                onMouseMove={this.onMouseMove}
            >
                {
                    !isDragging && this.state.showTooltip &&
                    <ItemTooltip item={itemTemplate} coords={this.state.mousePosition} />
                }
                <div className="item-layer item-name"><span>{this.props.shopItem.name}</span></div>
                {
                    this.props.shopItem.count > 1 &&
                    <div className="item-layer item-count"><span>{this.props.shopItem.count}</span></div>
                }
            </div>
        );
    }
}
const itemSource = {
    beginDrag(props) {
        return {
            item: props.item,
        };
    },

    endDrag(props, monitor, component) {
        if (!monitor.didDrop()) {
            return;
        }

        const item = monitor.getItem();
        const dropResult = monitor.getDropResult();
        console.log(item, dropResult);

        if (dropResult && dropResult.inventorySlot) {
            // if the drop target is an equipped slot the character buys the item
            if (dropResult.inventorySlot.startsWith('inv-')) {
                return; //buyItem(item);
            }

            return;
        }
    },
};

const collect = (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging(),
    };
};

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        buyItem,
    }, dispatch);
}

export default connect(null, mapDispatchToProps)(dragSource('item', itemSource, collect)(Item));
