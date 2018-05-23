import React from 'react';
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';
import {formatNumberDecimal} from '../../../helper';

class ItemTooltip extends React.Component {
    constructor(props) {
        super(props);
        this.portalElement = document.createElement('div');
    }

    generateDescription(item) {
        let description = item.description;

        if (item.stats) {
            Object.keys(item.stats).map((key) => {
                if (typeof item.stats[key] !== 'object') {
                    const exp = new RegExp(`({${key}})+`, 'gi');
                    description = description.replace(exp, item.stats[key]);
                }
            });
        }

        return description;
    }

    componentWillMount() {
        document.body.appendChild(this.portalElement);
    }

    componentWillUnmount() {
        document.body.removeChild(this.portalElement);
    }

    calculateSellPrice() {
        const {item, character, shop, EnhStreetSmarts} = this.props;
        let basePrice = item.stats.price * shop.buy.priceMultiplier;

        if (shop.buy.list.length > 0 && !shop.buy.list.includes(item.id)) {
            return 0;
        }

        if (shop.buy.ignoreType.includes(item.type) || shop.buy.ignoreSubtype.includes(item.subtype)) {
            return 0;
        }

        if (item.subtype !== 'drug') {
            return basePrice;
        }

        const CharacterStreetSmarts = character.enhancements['streetsmarts'];

        if (!CharacterStreetSmarts) {
            return basePrice;
        }

        const enhTier = EnhStreetSmarts.tree.find((tier) => tier.tier === CharacterStreetSmarts.modifiers.value);
        return basePrice * enhTier.markup;
    }

    render() {
        if (!this.props.item) {
            return null;
        }

        const {item, shop, coords, isShopItem} = this.props;

        return ReactDOM.createPortal(
            <div className="item-tooltip" style={{top: (coords.y + 10) + 'px', left: (coords.x + 10) + 'px'}}>
                <div className="name">{item.name}</div>
                <div className="description">{this.generateDescription(item)}</div>
                <div className="stats">
                    {
                        item.stats &&
                        Object.keys(item.stats).map((key, index) => {
                            if (typeof item.stats[key] !== 'object') {
                                // hide the base price of items, as the player cannot depend on this value.
                                if (key === 'price') {
                                    return null;
                                }

                                let value = item.stats[key];

                                if (typeof value === 'boolean') {
                                    value = value.toString();
                                }

                                return <div key={index}>{key}: {value}</div>;
                            }
                        })
                    }
                </div>
                {
                    item.count &&
                    <div className="count">Count: {item.count}</div>
                }
                {
                    shop && !isShopItem &&
                    <div className="sell-price">Sells For: {formatNumberDecimal(this.calculateSellPrice())} /ea</div>
                }
            </div>
            , this.portalElement
        );
    }
}

function mapStateToProps(state) {
    return {
        shop: state.shop,
        character: state.character.selected,
        EnhStreetSmarts: state.game.enhancements.find((enh) => enh.id === 'streetsmarts'),
    };
}

export default connect(mapStateToProps)(ItemTooltip);
