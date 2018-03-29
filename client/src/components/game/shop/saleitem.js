import React from 'react';
import {connect} from 'react-redux';
import Item from './item';

// UI
import {Card} from 'reactstrap';

class SaleItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {shopItem, shopFingerprint} = this.props;
        const itemObj = this.props.itemList[shopItem.id];

        // if the item is no longer available in the game, ignore it.
        if (!itemObj) {
            return null;
        }

        return (
            <Card className="sale-item">
                <Item
                    shopItem={shopItem}
                    shopFingerprint={shopFingerprint}
                    itemObj={itemObj} />
                <div>
                    {shopItem.name}<br/>
                    Cost: {shopItem.price}
                </div>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        itemList: state.game.items,
    };
}

export default connect(mapStateToProps)(SaleItem);
