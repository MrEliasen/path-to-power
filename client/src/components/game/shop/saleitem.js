import React from 'react';
import {connect} from 'react-redux';
import Item from './item';
import {formatNumberDecimal} from '../../../helper';

// UI
import {Card} from 'reactstrap';

class SaleItem extends React.Component {
    constructor(props) {
        super(props);
    }

    renderNotification(canBuyExp, canBuyMoney) {
        let message = '';

        if (canBuyExp && canBuyMoney) {
            return null;
        }

        if (!canBuyMoney) {
            message = `Not Enough Money (costs ${formatNumberDecimal(shopItem.price * this.props.priceMultiplier)})`;
        }

        if (!canBuyExp) {
            message = `Not Enough EXP (${shopItem.expRequired} Needed)`;
        }

        return <p className="notification">{message}</p>;
    }

    render() {
        const {shopItem, shopFingerprint, character} = this.props;
        const itemObj = this.props.itemList[shopItem.id];

        // if the item is no longer available in the game, ignore it.
        if (!itemObj) {
            return null;
        }

        const canBuyExp = shopItem.expRequired <= character.stats.exp;
        const canBuyMoney = shopItem.price <= character.stats.money;

        return (
            <Card className={'sale-item' + (!canBuyExp || !canBuyMoney ? ' --cant-buy' : '')}>
                {
                    this.renderNotification(canBuyExp, canBuyMoney)
                }
                <div className="item-details">
                    <Item
                        shopItem={shopItem}
                        shopFingerprint={shopFingerprint}
                        itemObj={itemObj} />
                    <div>
                        {shopItem.name}<br/>
                        Price: {formatNumberDecimal(shopItem.price * this.props.priceMultiplier)}
                    </div>
                </div>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        itemList: state.game.items,
        character: state.character.selected,
    };
}

export default connect(mapStateToProps)(SaleItem);
