import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Row, Col, Modal, ModalHeader, ModalBody} from 'reactstrap';

// components
import ItemSlot from '../item/slot';
import DropSlot from './drop';
import SaleItem from './saleitem';

// actions
import {shopClose} from './actions';

class Shop extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const slots = Array.from(Array(this.props.inventorySize).keys());

        return (
            <Modal isOpen={this.props.isOpen} toggle={this.props.shopClose} size="lg">
                <ModalHeader toggle={this.props.shopClose}>Shop</ModalHeader>
                <ModalBody>
                    <Row>
                        <Col xs="6">
                            <div id="shop">
                                {
                                    this.props.shop && this.props.shop.sell.list.map((shopItem, index) =>
                                        <SaleItem
                                            key={index}
                                            shopFingerprint={this.props.shop.fingerprint}
                                            shopItem={shopItem} />
                                    )
                                }
                            </div>
                        </Col>
                        <Col xs="6">
                            <div id="inventory">
                                {
                                    slots.length && slots.map((inventorySlot, index) => {
                                        return <ItemSlot key={index} inventorySlot={'inv-' + inventorySlot} />;
                                    })
                                }
                                <DropSlot />
                            </div>
                        </Col>
                    </Row>
                </ModalBody>
            </Modal>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        shopClose,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        shop: state.shop,
        isOpen: state.shop ? state.shop.open : false,
        inventorySize: state.character.selected ? state.character.selected.stats.inventorySize : 0,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Shop);
