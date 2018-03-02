import React from 'react';
import Item from '../item';

class ItemSlot extends React.Component {
    constructor(props) {
        super(props);

        this.id = this.props.slotId;
        this.items = this.props.items;
    }

    render() {
        const item = this.items.find((item) => item.slotId == this.id);
        return (
            <div className="item-slot">
                {item && <Item item={item} />}
            </div>
        );
    }
}

export default ItemSlot;
