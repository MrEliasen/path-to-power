import React from 'react';
import {connect} from 'react-redux';
import ItemSlot from '../item/slot';
import DropSlot from './drop';

class Inventory extends React.Component {
    constructor(props) {
        super(props);

        this.slots = Array.from(Array(this.props.inventorySize).keys());
    }

    render() {
        return (
            <div id="inventory">
                {
                    this.slots.length && this.slots.map((inventorySlot, index) => {
                        return <ItemSlot key={index} inventorySlot={'inv-' + inventorySlot} />;
                    })
                }
                <DropSlot />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        inventorySize: state.character.selected.stats.inventorySize,
    };
}

export default connect(mapStateToProps)(Inventory);
