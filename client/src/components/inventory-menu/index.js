import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleInventoryMenu, equipItem, unequipItem} from './actions';

const menuItemStyle = {
    'lineHeight': '32px',
    'minHeight': '32px',
    'fontSize': '14px',
};

class InventoryMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            index: -1,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.inventory.length !== this.props.inventory.length) {
            this.setState({open: false, index: -1});
        }
    }

    hide(element, item) {
        this.setState({
            open: true,
            itemElement: element,
            item,
        });
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

    equip() {
        this.props.sendAction(equipItem(this.state.index));
    }

    unequip() {
        this.props.sendAction(unequipItem(this.props.inventory[this.state.index].equipped_slot));
    }

    drop() {
        this.props.sendCommand(`/dropbyindex ${this.state.index} 1`);
    }

    useItem() {
        this.props.sendCommand(`/usebyindex ${this.state.index}`);
    }

    render() {
        const styles = {
            info: {
                fontSize: '14px',
                padding: '7px 16px',
                margin: '0px',
            },
        };

        const hasEquippedItems = this.props.inventory.filter((obj) => obj.equipped_slot).length ? true : false;
        const hasInventoryItems = this.props.inventory.filter((obj) => !obj.equipped_slot).length ? true : false;

        return (
            <React.Fragment>
                <div className="c-inventory-menu" >
                    <div>{`Inventory (${this.props.inventory.length}/${this.props.charcterStats.inventorySize})`}</div>
                    <div>Equipped Items</div>
                    {
                        hasEquippedItems &&
                        this.props.inventory.map((item, index) => {
                            if (!item.equipped_slot) {
                                return null;
                            }

                            return <div
                                onClick={(e) => this.setState({open: true, item, index})}
                                key={item.fingerprint}
                                style={menuItemStyle}
                            >{item.name}</div>;
                        })
                    }
                    {
                        !hasEquippedItems &&
                        <div style={{fontSize: '14px', paddingTop: '0px'}}>Nothing Equipped<br />Click an item to show more info.</div>
                    }
                    <div className="divider"/>
                    <div>Inventory Items</div>
                    <div className="c-inventory-list">
                        {
                            this.props.inventory &&
                            this.props.inventory.map((item, index) => {
                                if (item.equipped_slot) {
                                    return null;
                                }

                                return <div
                                    onClick={(e) => this.setState({open: true, item, index})}
                                    key={item.fingerprint}
                                    style={menuItemStyle}
                                    className="__inventory-item"
                                >{item.name}<br />{(item.stats.stackable ? `${item.stats.durability}` : '')}</div>;
                            })
                        }
                        {
                            !hasInventoryItems &&
                            <div style={{backgroundColor: 'none', fontSize: '14px', paddingTop: '0px'}}>Inventory is empty<br />You can buy items from the Pawn Shop, take them from NPCs and more.</div>
                        }
                    </div>
                </div>
                <div
                >
                    {
                        this.state.index >= 0 &&
                        <React.Fragment>
                            <div>{this.props.inventory[this.state.index].name}</div>
                            <div>Description</div>
                            <p style={styles.info}>{this.generateDescription(this.props.inventory[this.state.index])}</p>
                            <div className="divider"/>
                            <div>Stats</div>
                            {
                                this.props.inventory[this.state.index].stats &&
                                Object.keys(this.props.inventory[this.state.index].stats).map((statKey) => {
                                    if (typeof this.props.inventory[this.state.index].stats[statKey] !== 'object') {
                                        <p key={statKey} style={styles.info}>{statKey}: {this.props.inventory[this.state.index].stats[statKey]}</p>;
                                    }
                                })
                            }
                            <div className="divider"/>
                            <div className="c-item-actions">
                                {
                                    this.props.inventory[this.state.index].stats.equipable &&
                                    this.props.inventory[this.state.index].equipped_slot &&
                                    <button onClick={this.unequip.bind(this)} label="Un-Equip" secondary={true} />
                                }
                                {
                                    this.props.inventory[this.state.index].stats.equipable &&
                                    !this.props.inventory[this.state.index].equipped_slot &&
                                    <button onClick={this.equip.bind(this)} label="Equip" primary={true}/>
                                }
                                {
                                    this.props.inventory[this.state.index].hasUseEffect &&
                                    <button onClick={this.useItem.bind(this)} label="Use" primary={true}/>
                                }
                                <button label="Drop" onClick={this.drop.bind(this)}/>
                            </div>
                        </React.Fragment>
                    }
                </div>
            </React.Fragment>
        );
    }
}

function mapStateToProps(state) {
    return {
        inventory: state.character ? [...state.character.inventory] : [],
        charcterStats: state.character ? {...state.character.stats} : {},
        open: state.inventorymenu.open,
    };
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        toggleInventoryMenu,
    }, dispatch);
}

export default connect(mapStateToProps, mapActionsToProps)(InventoryMenu);
