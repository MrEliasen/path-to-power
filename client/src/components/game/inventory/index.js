import React from 'react';
import ItemSlot from '../itemslot';

class Inventory extends React.Component {
    constructor(props) {
        super(props);

        // Fake sluts
        this.slots = Array.from(Array(100).keys());
        this.items = this.props.items;
    }

    render() {
        return (
            <div id="inventory">
                {
                    this.slots.length && this.slots.map((slotId, index) => {
                        return <ItemSlot key={index} items={this.items} slotId={slotId} />;
                    })
                }
            </div>
        );
    }
}

export default Inventory;
