import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Alert, Row, Col, Modal, ModalHeader, ModalBody} from 'reactstrap';

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

    renderNotification() {
        if (!this.props.shop || !this.props.shop.notification) {
            return null;
        }

        const {type, message} = this.props.shop.notification;
        let color = 'danger';

        switch (type) {
            case 'success':
                color = 'success';
                break;

            case 'info':
                color = 'info';
                break;
        }

        return <Alert color={color}>
            {message}
        </Alert>;
    }

    render() {
        const {shop, inventorySize} = this.props;
        const slots = Array.from(Array(inventorySize).keys());

        return (
            <Modal isOpen={this.props.isOpen} toggle={this.props.shopClose} size="lg">
                <ModalHeader toggle={this.props.shopClose}>Shop</ModalHeader>
                <ModalBody>
                    {this.renderNotification()}
                    <Row>
                        <Col xs="6">
                            <div id="shop">
                                {
                                    shop && shop.sell.list.map((shopItem, index) =>
                                        <SaleItem
                                            key={index}
                                            shopFingerprint={shop.fingerprint}
                                            shopItem={shopItem} />
                                    )
                                }
                                {
                                    shop && !shop.sell.enabled &&
                                    <p>No selling anything.</p>
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
