import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {toggleInventoryMenu, equipItem, unequipItem} from './actions';

// UI
import Drawer from 'material-ui/Drawer';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import AppBar from 'material-ui/AppBar';
import {ListItem} from 'material-ui/List';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import NavigationBack from 'material-ui/svg-icons/navigation/last-page';

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
                <Drawer
                    width={275}
                    openSecondary={true}
                    open={this.props.open}
                    docked={false}
                    className="c-inventory-menu"
                    onRequestChange={this.props.toggleInventoryMenu}
                >
                    <AppBar
                        title={`Inventory (${this.props.inventory.length}/${this.props.charcterStats.inventorySize})`}
                        iconElementLeft={
                            <IconButton onClick={this.props.toggleInventoryMenu}>
                                <NavigationClose />
                            </IconButton>
                        }
                    />
                    <Subheader>Equipped Items</Subheader>
                    {
                        hasEquippedItems &&
                        this.props.inventory.map((item, index) => {
                            if (!item.equipped_slot) {
                                return null;
                            }

                            return <MenuItem
                                onClick={(e) => this.setState({open: true, item, index})}
                                key={item.fingerprint}
                                style={menuItemStyle}
                                primaryText={item.name}
                            />;
                        })
                    }
                    {
                        !hasEquippedItems &&
                        <ListItem
                            primaryText="Nothing Equipped"
                            secondaryText="Click an item to show more info."
                            disabled={true}
                            style={{fontSize: '14px', paddingTop: '0px'}}
                        />
                    }
                    <Divider/>
                    <Subheader>Inventory Items</Subheader>
                    <div className="c-inventory-list">
                        {
                            this.props.inventory &&
                            this.props.inventory.map((item, index) => {
                                if (item.equipped_slot) {
                                    return null;
                                }

                                return <MenuItem
                                    onClick={(e) => this.setState({open: true, item, index})}
                                    key={item.fingerprint}
                                    style={menuItemStyle}
                                    primaryText={item.name}
                                    className="__inventory-item"
                                    secondaryText={(item.stats.stackable ? `${item.stats.durability}` : '')}
                                />;
                            })
                        }
                        {
                            !hasInventoryItems &&
                            <ListItem
                                primaryText="Inventory is empty"
                                secondaryText="You can buy items from the Pawn Shop, take them from NPCs and more."
                                secondaryTextLines={2}
                                disabled={true}
                                style={{backgroundColor: 'none', fontSize: '14px', paddingTop: '0px'}}
                            />
                        }
                    </div>
                </Drawer>
                <Drawer
                    width={325}
                    openSecondary={true}
                    open={this.state.open}
                    docked={false}
                    onRequestChange={() => {
                        this.setState({open: false});
                    }}
                >
                    {
                        this.state.index >= 0 &&
                        <React.Fragment>
                            <AppBar
                                title={this.props.inventory[this.state.index].name}
                                showMenuIconButton={false}
                                iconElementRight={
                                    <IconButton onClick={() => {
                                        this.setState({open: false});
                                    }}>
                                        <NavigationBack />
                                    </IconButton>
                                }
                            />
                            <Subheader>Description</Subheader>
                            <p style={styles.info}>{this.generateDescription(this.props.inventory[this.state.index])}</p>

                            <Divider/>
                            <Subheader>Stats</Subheader>
                            {
                                this.props.inventory[this.state.index].stats &&
                                Object.keys(this.props.inventory[this.state.index].stats).map((statKey) => {
                                    if (typeof this.props.inventory[this.state.index].stats[statKey] !== 'object') {
                                        <p key={statKey} style={styles.info}>{statKey}: {this.props.inventory[this.state.index].stats[statKey]}</p>;
                                    }
                                })
                            }
                            <Divider/>
                            <div className="c-item-actions">
                                {
                                    this.props.inventory[this.state.index].stats.equipable &&
                                    this.props.inventory[this.state.index].equipped_slot &&
                                    <RaisedButton onClick={this.unequip.bind(this)} label="Un-Equip" secondary={true} />
                                }
                                {
                                    this.props.inventory[this.state.index].stats.equipable &&
                                    !this.props.inventory[this.state.index].equipped_slot &&
                                    <RaisedButton onClick={this.equip.bind(this)} label="Equip" primary={true}/>
                                }
                                {
                                    this.props.inventory[this.state.index].hasUseEffect &&
                                    <RaisedButton onClick={this.useItem.bind(this)} label="Use" primary={true}/>
                                }
                                <RaisedButton label="Drop" onClick={this.drop.bind(this)}/>
                            </div>
                        </React.Fragment>
                    }
                </Drawer>
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
