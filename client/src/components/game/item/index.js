import React from 'react';
import {DragSource as dragSource} from 'react-dnd';
import ItemTooltip from '../itemtooltip';

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
                    ! isDragging && this.state.showTooltip && <ItemTooltip item={this.props.item} coords={this.state.mousePosition} />
                }
                <div className="item-layer item-name"><span>{this.props.item.name}</span></div>
                {
                    this.props.item.count > 1 &&
                    <div className="item-layer item-count"><span>{this.props.item.count}</span></div>
                }
            </div>
        );
    }
}
const itemSource = {
    beginDrag(props) {
      return {id: props.id};
    },

    endDrag(props, monitor, component) {
      if (! monitor.didDrop()) {
        return;
      }

      const item = monitor.getItem();
      const dropResult = monitor.getDropResult();
      console.log(item, dropResult.listId);
    },
};

const collect = (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging(),
    };
};

export default dragSource('item', itemSource, collect)(Item);
