import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {withRouter} from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    CardHeader,
    CardBody,
    Input,
    Button,
    Form,
    FormGroup,
} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {getStrategies} from '../auth/actions';
import {getUserDetails, updateAccount} from './actions'
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
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }
        this.props.getStrategies();
        this.props.getUserDetails(this.props.user._id, this.props.authToken);
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
        if (! this.props.strategies) {
            return '';
        }

        let authLocal = this.props.strategies.find((strat) => strat.provider === 'local');
        let authOther = this.props.strategies.filter((strat) => strat.provider !== 'local');

        return (
            <Row>
                {
                    // Show if local authentication strategy is enabled
                    authLocal &&
                    <Col sm="12" md="6">
                        <Card className="card-small">
                            <CardHeader>Update/Add Password</CardHeader>
                            <CardBody className="text-center">
                                <Form>
                                    <Notification />
                                    <FormGroup>
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
                                    </FormGroup>
                                    <hr/>
                                    {
                                        this.props.user.hasPassword &&
                                        <FormGroup>
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
                                        </FormGroup>
                                    }
                                    <FormGroup>
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
                                    </FormGroup>
                                    <FormGroup>
                                        <Input
                                            type="password"
                                            name="confirm-password"
                                            placeholder="Confirm New Password"
                                            onChange={(e) => {
                                                this.setState({
                                                    passwordConfirm: e.target.value,
                                                });
                                            }}
                                            value={this.state.passwordConfirm}
                                        />
                                    </FormGroup>
                                    <Button onClick={this.updateDetails} block={true} color="primary">Update</Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                }
                {
                    // Show if we have any strategies other than local authentication
                    authOther && authOther.length > 0 &&
                    <Col sm="12" md="6">
                        <Card className="card-small">
                            <CardHeader>Link/Unlink Accounts</CardHeader>
                            <CardBody className="text-center">
                                {

                                    authOther.map((strat) => {
                                        const isLinked = this.props.user.identities.find((obj) => obj.provider === strat.provider);

                                        return <a
                                            key={strat.provider}
                                            className={`btn btn-block btn-brand-${strat.provider} ${isLinked ? 'btn-success' : 'btn-primary'}`}
                                            href={strat.authUrl}
                                        >
                                            <FontAwesomeIcon icon={['fab', strat.provider]} /> Link {strat.name}
                                        </a>;
                                    })
                                }
                            </CardBody>
                        </Card>
                    </Col>
                }
            </Row>
        );
    }
};

function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
        strategies: state.auth.strategies,
        user: state.account.user,
        authToken: state.account.authToken,
        notification: state.app.notification,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getStrategies,
        getUserDetails,
        updateAccount,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AccountSecurity));
