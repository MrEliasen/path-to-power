import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// Actions
import {shopBuy, shopSell, shopClose, getItemDetails} from './actions';

const listItemStyle = {
    lineHeight: '26px',
    minHeight: '26px',
    padding: '6px 16px',
};
const badgeStyle = {
    lineHeight: '26px',
    minHeight: '26px',
    padding: '6px 16px',
    margin: '0px',
};

class Shop extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tab: 'buy',
            selected: null,
        };

        this.select = this.select.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.shop || !nextProps.shop.open) {
            return this.setState({selected: null});
        }

        this.setState({
            tab: (nextProps.shop.sell.enabled ? 'buy' : 'sell'),
        });
    }

    buyItem() {
        this.props.sendAction(shopBuy(this.state.selected.item.id, this.state.selected.index, this.props.shop.fingerprint));
    }

    sellItem() {
        this.props.sendAction(shopSell(this.state.selected.item.fingerprint, this.props.shop.fingerprint));
    }

    select(item, index, listName) {
        this.setState({
            selected: {
                item,
                index,
                listName,
            },
        });

        this.props.sendAction(getItemDetails(
            item.id,
            this.props.shop.fingerprint,
            (listName === 'inventory' ? 'buy' : 'sell'),
        ));
    }

    isSelected(id, listName) {
        if (!this.state.selected || this.state.selected.listName !== listName) {
            return '';
        }

        // use fingerprint when in the inventory
        if (listName === 'inventory') {
            if (this.state.selected.item.fingerprint === id) {
                return '--selected';
            }
        } else {
            // and index for shop
            if (this.state.selected.index === id) {
                return '--selected';
            }
        }
    }

    generateDescription(description, stats) {
        Object.keys(stats).map((key) => {
            const exp = new RegExp(`({${key}})+`, 'gi');
            description = description.replace(exp, stats[key]);
        });

        return description;
    }

    renderItemDetails(listName) {
        if (!this.state.selected || this.state.selected.listName !== listName) {
            return <p>Select and item to see more details.</p>;
        }

        if (!this.props.shop.details || this.props.shop.details.itemId !== this.state.selected.item.id) {
            return <div size={80} thickness={5} />;
        }

        const itemTemplate = this.props.items[this.state.selected.item.id];
        const selectedItemModifiers = this.state.selected.list === 'inventory' ? this.state.selected.item.stats : {};

        return <React.Fragment>
            <strong>Name:</strong> {itemTemplate.name}<br/>
            <strong>{this.state.selected.list === 'inventory' ? 'Sell ' : ''}Price:</strong> {this.props.shop.details.price}
            <br/>
            <strong>Stackable:</strong> {(itemTemplate.stats.stackable ? 'Yes' : 'No')}<br/>
            <strong>Description:</strong> {this.generateDescription(itemTemplate.description, Object.assign({...itemTemplate.stats}, selectedItemModifiers))}
            {
                this.state.selected.item.expRequired > this.props.stats.exp &&
                <strong className="__shop-warning">You are not height enough rank to buy this item.</strong>
            }
        </React.Fragment>;
    }

    renderInventory() {
        if (!this.props.shop.buy.enabled) {
            return <li disabled={true}>Not interested in buying.</li>;
        }

        if (!this.props.inventory) {
            return null;
        }

        return this.props.inventory.map((item, index) =>
            <li
                key={index}
                rightIcon={(
                    !item.stats.stackable ? null : <span style={badgeStyle}>{item.stats.durability}</span>
                )}
                innerDivStyle={listItemStyle}
                onClick={() => this.select(item, index, 'inventory')}
                className={this.isSelected(item.fingerprint, 'inventory')}
            >
                {item.name}
            </li>
        );
    }

    render() {
        if (!this.props.shop) {
            return null;
        }

        const closeButton = <button
            label="Close"
            secondary={true}
            onClick={this.props.shopClose}
            className="__close-shop"
        />;

        return (
            <div
                title={this.props.shop.title}
                onRequestClose={this.props.shopClose}
                open={this.props.shop.open}
                bodyStyle={{padding: '0px'}}
            >
                <ul
                    value={this.state.tab}
                    onChange={(value) => {
                        this.setState({
                          tab: value,
                        });
                    }}
                >
                    {
                        this.props.shop.sell.enabled &&
                        <li label="Buy" value="buy">
                            <div className="c-shop-items">
                                <div className="__item-list">
                                    <strong>Selling</strong>
                                    <List>
                                        {
                                            this.props.shop.sell.list.map((item, index) => {
                                                const style = {...listItemStyle};
                                                let rightIcon = (
                                                    item.quantity === -1 ? null : <span style={badgeStyle}>{item.quantity}</span>
                                                );

                                                if (item.expRequired > this.props.stats.exp) {
                                                    Object.assign(style, {'color': 'rgba(0,0,0, 0.3)'});
                                                }

                                                return <li
                                                    key={index}
                                                    rightIcon={rightIcon}
                                                    innerDivStyle={style}
                                                    onClick={() => this.select(item, index, 'selling')}
                                                    className={this.isSelected(index, 'selling')}
                                                >
                                                    {this.props.items[item.id].name}
                                                </li>;
                                            })
                                        }
                                    </List>
                                </div>
                                <div className="__item-details">
                                    <strong>Item Details</strong><br/>
                                    {this.renderItemDetails('selling')}
                                    <button
                                        label="Buy Item"
                                        primary={true}
                                        className="__action-shop"
                                        disabled={!this.state.selected || this.state.selected.listName !== 'selling'}
                                        onClick={this.buyItem.bind(this)}
                                    />
                                    {closeButton}
                                </div>
                            </div>
                        </li>
                    }
                    {
                        this.props.shop.buy.enabled &&
                        <li label="Sell" value="sell">
                            <div className="c-shop-items">
                                <div className="__item-list">
                                    <strong>Your Inventory</strong>
                                    <List>
                                        {this.renderInventory()}
                                    </List>
                                </div>
                                <div className="__item-details">
                                    <strong>Item Details</strong><br/>
                                    {this.renderItemDetails('inventory')}
                                    <button
                                        label="Sell Item"
                                        primary={true}
                                        className="__action-shop"
                                        disabled={!this.state.selected || this.state.selected.listName !== 'inventory'}
                                        onClick={this.sellItem.bind(this)}
                                    />
                                    {closeButton}
                                </div>
                            </div>
                        </li>
                    }
                </ul>
            </div>
        );
    }
};

function mapStateToProps(state) {
    return {
        shop: state.shop ? {...state.shop} : null,
        items: {...state.game.items},
        inventory: state.character ? [...state.character.inventory] : null,
        stats: state.character ? {...state.character.stats} : null,
        notification: {},
    };
}

function bindActionsToProps(dispatch) {
    return bindActionCreators({shopClose}, dispatch);
}

export default connect(mapStateToProps, bindActionsToProps)(Shop);
