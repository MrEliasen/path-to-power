import React from 'react';
import {connect} from 'react-redux';
import Item from './item';
import {formatNumberDecimal} from '../../../helper';

// UI
import {Card} from 'reactstrap';

class SaleItem extends React.Component {
    constructor(props) {
        super(props);

        this.calculateSellPrice = this.calculateSellPrice.bind(this);
        this.renderNotification = this.renderNotification.bind(this);
    }

    renderNotification(canBuyExp, canBuyMoney) {
        const {shopItem} = this.props;
        let message = '';

        if (canBuyExp && canBuyMoney) {
            return null;
        }

        if (!canBuyMoney) {
            message = `Insufficient Cash (${formatNumberDecimal(this.calculateSellPrice())})`;
        }

        if (!canBuyExp) {
            message = `Insufficient Accumulated EXP (${shopItem.expRequired})`;
        }

        return <p className="notification">{message}</p>;
    }

    calculateSellPrice() {
        const {shopItem, character, priceMultiplier, EnhStreetSmarts} = this.props;
        const itemObj = this.props.itemList[shopItem.id];
        let basePrice = shopItem.price * priceMultiplier;

        if (itemObj.subtype !== 'drug') {
            return basePrice;
        }

        const CharacterStreetSmarts = character.enhancements['streetsmarts'];

        if (!CharacterStreetSmarts) {
            return basePrice;
        }

        const enhTier = EnhStreetSmarts.tree.find((tier) => tier.tier === CharacterStreetSmarts.modifiers.value);
        return basePrice * enhTier.discount;
    }

    render() {
        const {shopItem, shopFingerprint, character} = this.props;
        const itemObj = this.props.itemList[shopItem.id];

        // if the item is no longer available in the game, ignore it.
        if (!itemObj) {
            return null;
        }

        const sellPrice = this.calculateSellPrice();
        const canBuyExp = shopItem.expRequired ? shopItem.expRequired <= character.stats.exp_total : true;
        const canBuyMoney = sellPrice <= character.stats.money;

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
                        Price: {formatNumberDecimal(sellPrice)}
                    </div>
                </div>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        priceMultiplier: state.shop ? state.shop.sell.priceMultiplier : 1.0,
        itemList: state.game.items,
        character: state.character.selected,
        EnhStreetSmarts: state.game.enhancements.find((enh) => enh.id === 'streetsmarts'),
    };
}

export default connect(mapStateToProps)(SaleItem);
