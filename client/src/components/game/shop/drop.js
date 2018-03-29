import React from 'react';
import {DropTarget as dropTarget} from 'react-dnd';

class DropSlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {isOver, canDrop, connectDropTarget} = this.props;

        return connectDropTarget(
            <div className="item-slot --drop" style={{textAlign: 'center'}}>
                {!isOver && !canDrop && <div className="layer">SELL ITEM</div>}
                {isOver && canDrop && <div className="layer green">SELL ITEM</div>}
                {!isOver && canDrop && <div className="layer yellow">SELL ITEM</div>}
                {isOver && !canDrop && <div className="layer red">THE SHOP WONT<br/>BUY THIS ITEM</div>}
            </div>
        );
    }
}

// Contract for the dropTarget
const DropSlotTarget = {
    canDrop(props, monitor) {
        return true;
    },

    hover(props, monitor, component) {
        // const canDrop = monitor.canDrop();
    },

    drop(props, monitor, component) {
        // In case you drop onto multiple nested targets,
        // we only want the source to drop once on this target
        // This prevents propagation if needed
        if (monitor.didDrop()) {
            return;
        }

        // Get the object being dropped
        // const item = monitor.getItem();

        // Returns data for monitor.getDropResult() for the source's endDrag() method
        return {inventorySlot: 'dropSell', dropped: true};
    },
};

// Props injected into the DropSlot component from the dropTarget component
const collect = (connect, monitor) => {
    return {
        // Call this inside render() to inject event handlers into the component
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({shallow: true}),
        canDrop: monitor.canDrop(),
        itemType: monitor.getItemType(),
    };
};

export default dropTarget('item', DropSlotTarget, collect)(DropSlot);
