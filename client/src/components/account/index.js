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
import Notification from '../ui/notification';

class Account extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            passwordConfirm: '',
        };
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }

        if (!this.props.strategies) {
            this.props.getStrategies();
        }
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
                                    {
                                        1 == 2 &&
                                        <FormGroup>
                                            <Input
                                                type="password"
                                                placeholder="Current Password"
                                                onChange={(e) => {
                                                    this.setState({
                                                        password: e.target.value,
                                                    });
                                                }}
                                                value={this.state.password}
                                            />
                                        </FormGroup>
                                    }
                                    <FormGroup>
                                        <Input
                                            type="password"
                                            placeholder="New Password"
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
                                            placeholder="Confirm New Password"
                                            onChange={(e) => {
                                                this.setState({
                                                    passwordConfirm: e.target.value,
                                                });
                                            }}
                                            value={this.state.passwordConfirm}
                                        />
                                    </FormGroup>
                                    <Button onClick={() => {}} block={true} color="primary">Update</Button>
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
                                        return <a key={strat.provider} className={`btn btn-block btn-primary btn-brand-${strat.provider}`} href={strat.authUrl}>
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
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getStrategies,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Account));
