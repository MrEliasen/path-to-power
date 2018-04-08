import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// UI
import {
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button,
} from 'reactstrap';
import Icon from '@fortawesome/react-fontawesome';

// actions
import {openNPCShop} from './actions';

class NPCs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dropdown: false,
        };

        this.toggleVisible = this.toggleVisible.bind(this);
    }

    toggleVisible(structureId) {
        this.setState({
            dropdown: !this.state.dropdown,
        });
    }

    render() {
        const npcList = this.props.list;
        const shops = npcList.filter((npc) => {
            return npc.hasShop;
        });

        // if there are no NPCS with shops.
        if (npcList && !shops.length) {
            return (
                <Button
                    onClick={this.props.onClick}
                    className="structure --block"
                >
                    <Icon icon="user-secret" /> NPCs ({this.props.list.length})
                </Button>
            );
        }

        return (
            <React.Fragment>
                <ButtonDropdown
                    className="structure dropdown --block"
                    isOpen={this.state.dropdown}
                    toggle={this.toggleVisible}
                >
                    <DropdownToggle style={{color: '#000'}} caret>
                        <Icon icon="user-secret" /> NPCs ({this.props.list.length})
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onClick={this.props.onClick}>View NPC List</DropdownItem>
                        <DropdownItem divider/>
                        <DropdownItem header>Shops:</DropdownItem>
                        {
                            shops.map((npc, index) => {
                                return <DropdownItem
                                    key={index}
                                    onClick={() => this.props.openNPCShop(`${npc.name} the ${npc.type}`)}
                                >
                                    {npc.name} the {npc.type}
                                </DropdownItem>;
                            })
                        }
                    </DropdownMenu>
                </ButtonDropdown>
            </React.Fragment>
        );
    }
}

function mapActionsToProps(dispatch) {
    return bindActionCreators({
        openNPCShop,
    }, dispatch);
}

export default connect(null, mapActionsToProps)(NPCs);
