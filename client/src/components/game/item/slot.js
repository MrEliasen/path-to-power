import React from 'react';
import {connect} from 'react-redux';
import {DropTarget as dropTarget} from 'react-dnd';
import Item from '../item';

class ItemSlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const item = this.props.inventory.find((item) => item.inventorySlot == this.props.inventorySlot);
        const {isOver, canDrop, connectDropTarget} = this.props;

        return connectDropTarget(
            <div className="item-slot">
                {item && <Item item={item} />}
                {isOver && canDrop && <div className="layer green" />}
                {!isOver && canDrop && <div className="layer yellow" />}
                {isOver && !canDrop && <div className="layer red" />}
            </div>
        );
    }
}

// Contract for the dropTarget
const itemSlotTarget = {
    canDrop(props, monitor) {
        // const draggedItem = monitor.getItem();
        return !this.item;
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
        return {inventorySlot: props.inventorySlot, dropped: true};
    },
};

// Props injected into the ItemSlot component from the dropTarget component
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
function mapStateToProps(state) {
    return {
        inventory: state.character.selected.inventory,
    };
}

export default connect(mapStateToProps)(dropTarget('item', itemSlotTarget, collect)(ItemSlot));
