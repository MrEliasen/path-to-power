import React from 'react';
import ItemSlot from '../item/slot';

class Inventory extends React.Component {
    constructor(props) {
        super(props);

        // Fake sluts
        this.slots = Array.from(Array(100).keys());
    }

    render() {
        return (
            <div id="inventory">
                {
                    this.slots.length && this.slots.map((slotId, index) => {
                        return <ItemSlot key={index} slotId={'inv-' + slotId} />;
                    })
                }
            </div>
        );
    }
}

export default Inventory;
