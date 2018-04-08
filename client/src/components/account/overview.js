import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

// UI
import {
    Card,
    CardHeader,
    CardBody,
    Table,
    Button,
    Popover,
    PopoverHeader,
    PopoverBody,
} from 'reactstrap';
import Notification from '../ui/notification';

// actions
import {deleteAccount} from './actions';
import {setLoading} from '../app/actions';

class AccountDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state ={
            popoverOpen: false,
            deleting: false,
        };

        this.togglePopover = this.togglePopover.bind(this);
        this.doDelete = this.doDelete.bind(this);
    }

    togglePopover() {
        this.setState({
            popoverOpen: !this.state.popoverOpen,
        });
    }

    doDelete() {
        this.togglePopover();
        this.props.setLoading('Processing your request, one moment..');
        this.props.deleteAccount(this.props.userId, this.props.authToken);
    }

    render() {
        return (
            <Card>
                <CardHeader>Your account</CardHeader>
                <CardBody>
                    <p>Here you can find an overview of the details we have about your account. If you would like to change any of these details, you can do so in the related menues on the left hand side.</p>
                    <h5>Account Details</h5>
                    <Table striped>
                        <thead>
                            <tr>
                                <th>Data Name</th>
                                <th>Data Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>E-mail</td>
                                <td>{this.props.email || ''}</td>
                            </tr>
                        </tbody>
                    </Table>

                    <h5>3rd Party Details</h5>
                    <Table striped>
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Account ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                this.props.identities &&
                                this.props.identities.map((identity, index) => {
                                    const provider = this.props.strategies.find((obj) => obj.id === identity.provider);

                                    if (!provider) {
                                        return null;
                                    }

                                    return <tr key={index}>
                                        <td>{provider.name}</td>
                                        <td>{identity.providerId}</td>
                                    </tr>;
                                })
                            }
                        </tbody>
                    </Table>
                    <Notification />
                    <div className="dangerzone">
                        <p>This is where you can permanently delete your account. This is an irreversible action!</p>
                        <Button id="delete-account" onClick={this.togglePopover} color="danger">Delete Account</Button>
                        <Popover
                            placement="bottom-start"
                            isOpen={this.state.popoverOpen}
                            target="delete-account"
                            toggle={this.togglePopover}
                        >
                            <PopoverHeader>Confirm Account Deletion</PopoverHeader>
                            <PopoverBody>
                                <h5 className="text-center">HALT!</h5>
                                <p>You are about to delete your account permanently! Are you sure you wish to continue?</p>
                                <Button color="danger" block={true} onClick={this.doDelete}>Yes, Delete Account!</Button>
                            </PopoverBody>
                        </Popover>
                    </div>
                </CardBody>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    if (!state.account.user) {
        return {};
    }

    return {
        email: state.account.user.email,
        identities: state.account.user.identities,
        strategies: state.auth.strategies,
        userId: state.account.user._id,
        authToken: state.account.authToken,
    };
}

function mapDispatchToProps(dispatch) {
        return bindActionCreators({
            deleteAccount,
            setLoading,
        }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountDetails);
