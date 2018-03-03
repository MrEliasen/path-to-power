import React from 'react';
import {connect} from 'react-redux';
// import {bindActionCreators} from 'redux';
import {DropTarget as dropTarget} from 'react-dnd';
import Item from '../item';

class ItemSlot extends React.Component {
    constructor(props) {
        super(props);

        // Find an item to show on this itemslot
        this.item = this.props.inventory.find((item, index) => {
            // Since the items in the inventory currently don't have a slotId property,
            // we just use the index of the item within the inventory and fake the slotId
            if (! item.slotId) {
                item.slotId = 'inv-' + index;
            }
            return item.slotId == this.props.slotId;
        });
    }

    render() {
        const {isOver, canDrop, connectDropTarget} = this.props;
        return connectDropTarget(
            <div className="item-slot">
                {this.item && <Item item={this.item} />}
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
        return ! this.item;
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
        return {slotId: props.slotId, dropped: true};
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
        inventory: state.character ? [...state.character.inventory] : [],
    };
}

export default connect(mapStateToProps)(dropTarget('item', itemSlotTarget, collect)(ItemSlot));
