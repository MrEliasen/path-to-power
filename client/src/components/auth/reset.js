import React from 'react';
import {withRouter} from 'react-router-dom';
import {push} from 'react-router-redux';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {Card, CardHeader, CardBody, Input, Button, Form, FormGroup} from 'reactstrap';
import Notification from '../ui/notification';

// Actions
import {getStrategies, resetPassword} from './actions';

class AuthLogin extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
        };

        this.submitRequest = this.submitRequest.bind(this);
    }

    componentDidMount() {
        this.props.getStrategies();

        if (this.props.loggedIn) {
            push('/account');
        }
    }

    submitRequest() {
        const {email} = this.state;

        this.setState({
            email: '',
        });

        this.props.resetPassword(email);
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Let's do this!</CardHeader>
                {
                    this.props.strategies &&
                    <CardBody className="text-center">
                        {
                            !this.props.strategies.find((auth) => auth.id === 'local') &&
                            <p>You cannot reset your password as local authentication is disabled.</p>
                        }
                        {
                            // if local authentication strategy is enabled
                            this.props.strategies.find((auth) => auth.id === 'local') &&
                            <React.Fragment>
                                <Notification />
                                <FormGroup>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        autoComplete="email"
                                        onChange={(e) => {
                                            this.setState({
                                                email: e.target.value,
                                            });
                                        }}
                                        value={this.state.email}
                                    />
                                </FormGroup>
                                <Button onClick={this.submitRequest} color="primary">Send Reset Link</Button>
                                <hr />
                                <p>When you submit a reset request, a password reset link will be sent to your email. You must click this link to finish the password reset process.</p>
                            </React.Fragment>
                        }
                    </CardBody>
                }
                {
                    !this.props.strategies &&
                    <p>Loading..</p>
                }
            </Card>
        );
    }
};

function mapStateToProps(state) {
    return {
        authToken: state.account.authToken,
        loggedIn: state.account.loggedIn,
        strategies: state.auth.strategies,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getStrategies,
        resetPassword,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLogin));
