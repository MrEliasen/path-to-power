import React from 'react';
import {connect} from 'react-redux';
import {DropTarget as dropTarget} from 'react-dnd';
import EquippedItem from './equippeditem';

class EquippedSlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const item = this.props.inventory.find((item) => item.inventorySlot == this.props.inventorySlot);
        const {isOver, canDrop, connectDropTarget} = this.props;

        return connectDropTarget(
            <div className="item-slot">
                {item && <EquippedItem item={item} />}
                {isOver && canDrop && <div className="layer green" />}
                {!isOver && canDrop && <div className="layer yellow" />}
                {isOver && !canDrop && <div className="layer red" />}
                <span className="slot-title">{this.props.title}</span>
            </div>
        );
    }
}

// Contract for the dropTarget
const EquippedSlotTarget = {
    canDrop(props, monitor) {
        const item = monitor.getItem();

        if (props.inventorySlot.indexOf('inv-') === 0) {
            return true;
        }

        // if the type is not armor and the subtype matches the slot name
        if (props.inventorySlot === `${item.itemType}-${item.itemSubtype}`) {
            return true;
        }

        return false;
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

// Props injected into the EquippedSlot component from the dropTarget component
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

export default connect(mapStateToProps)(dropTarget('item', EquippedSlotTarget, collect)(EquippedSlot));
