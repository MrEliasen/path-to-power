import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// actions
import {newEvent} from '../events/actions';
import {openShop} from '../shop/actions';

// UI
import {
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button,
} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

class Structure extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dropdown: false,
        };

        this.structureInfo = this.structureInfo.bind(this);
        this.toggleVisible = this.toggleVisible.bind(this);
    }

    structureInfo(e) {
        e.preventDefault();

        this.props.newEvent({
            type: 'structure-info',
            structure: this.props.structure,
        });
    }

    toggleVisible(structureId) {
        this.setState({
            dropdown: !this.state.dropdown,
        });
    }

    render() {
        const structure = this.props.structure;
        const shops = structure.shops;

        // if the structure has no shops, just render a default button.
        if (shops && !shops.length) {
            return (
                <Button
                    onClick={this.structureInfo}
                    className="structure --block"
                    style={{color: structure.colour}}
                >
                    <FontAwesomeIcon icon="building" /> {structure.name}
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
                    <DropdownToggle style={{color: structure.colour}} caret>
                        <FontAwesomeIcon icon="building" /> {structure.name}
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onClick={this.structureInfo}>Info</DropdownItem>
                        <DropdownItem divider/>
                        <DropdownItem header>Shops:</DropdownItem>
                        {
                            structure.shops.map((shop, shopIndex) => {
                                return <DropdownItem
                                    key={shopIndex}
                                    onClick={() => this.props.openShop(shop.name)}
                                >
                                    {shop.name}
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
        newEvent,
        openShop,
    }, dispatch);
}

export default connect(null, mapActionsToProps)(Structure);
