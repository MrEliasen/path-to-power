import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {
    Col,
    Card,
    CardHeader,
    CardBody,
    Input,
    Button,
    FormGroup,
    Label,
    Form,
} from 'reactstrap';
import {getStrategies} from '../auth/actions';
import {updateAccount} from './actions';
import Notification from '../ui/notification';

class AccountSecurity extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            password: '',
            passwordConfirm: '',
            currentPassword: '',
        };

        this.updateDetails = this.updateDetails.bind(this);
    }

    componentWillMount() {
        this.props.getStrategies();
    }

    componentDidMount() {
        if (this.props.user && this.props.user.email) {
            this.setState({
                email: this.props.user.email,
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        const email = this.props.user ? this.props.user.email : '';

        if (nextProps.user && nextProps.user.email !== email) {
            this.setState({
                email: nextProps.user.email,
            });
        }

        if (nextProps.notification && nextProps.notification.type !== 'error') {
            this.setState({
                password: '',
                passwordConfirm: '',
                currentPassword: '',
            });
        }
    }

    updateDetails() {
        this.props.updateAccount(this.props.user._id, this.props.authToken, {...this.state});
    }

    render() {
        let authLocal = this.props.strategies.find((strat) => strat.id === 'local');

        return (
            <Card>
                <CardHeader>Login & Security</CardHeader>
                <CardBody>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto eligendi quidem totam ea adipisci, ad vero provident quos ducimus pariatur atque repudiandae est autem distinctio magni aliquam recusandae tempora qui.</p>
                    <hr/>
                    <Notification />
                    {
                    // Show if local authentication strategy is enabled
                    authLocal &&
                        <Form>
                            <FormGroup row>
                                <Label for="user-firstname" sm="3">Email</Label>
                                <Col col="9">
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Account Email"
                                        autoComplete="email"
                                        onChange={(e) => {
                                            this.setState({
                                                email: e.target.value,
                                            });
                                        }}
                                        value={this.state.email}
                                    />
                                </Col>
                            </FormGroup>
                            {
                                this.props.user.hasPassword &&
                                <FormGroup row>
                                    <Label for="user-lastname" sm="3">Current Password</Label>
                                    <Col col="9">
                                        <Input
                                            type="password"
                                            name="password"
                                            placeholder="Current Password"
                                            autoComplete="current-password"
                                            onChange={(e) => {
                                                this.setState({
                                                    currentPassword: e.target.value,
                                                });
                                            }}
                                            value={this.state.currentPassword}
                                        />
                                    </Col>
                                </FormGroup>
                            }
                            <FormGroup row>
                                <Label for="user-firstname" sm="3">New Password</Label>
                                <Col col="9">
                                    <Input
                                        type="password"
                                        name="new-password"
                                        placeholder="New Password"
                                        autoComplete="new-password"
                                        onChange={(e) => {
                                            this.setState({
                                                password: e.target.value,
                                            });
                                        }}
                                        value={this.state.password}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label for="user-firstname" sm="3">Confirm Password</Label>
                                <Col col="9">
                                    <Input
                                        type="password"
                                        name="confirm-password"
                                        autoComplete="new-password"
                                        placeholder="Confirm New Password"
                                        onChange={(e) => {
                                            this.setState({
                                                passwordConfirm: e.target.value,
                                            });
                                        }}
                                        value={this.state.passwordConfirm}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Col sm={{size: 9, offset: 3}}>
                                    <Button onClick={this.updateDetails} color="primary">Save changes</Button>
                                </Col>
                            </FormGroup>
                        </Form>
                    }
                </CardBody>
            </Card>
        );
    }
};

function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
        strategies: state.auth.strategies || [],
        user: state.account.user,
        authToken: state.account.authToken,
        notification: state.app.notification,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getStrategies,
        updateAccount,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountSecurity);
