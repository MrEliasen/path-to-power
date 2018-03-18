import React from 'react';
import {withRouter} from 'react-router-dom';
import {Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {Card, CardHeader, CardBody, Input, Button, Form, FormGroup} from 'reactstrap';
import Notification from '../ui/notification';

// Actions
import {authLogin, authLocal, authProvider} from '../account/actions';
import {getStrategies, linkProvider} from './actions';

class AuthLogin extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            strategies: null,
            email: '',
            password: '',
            error: '',
        };

        this.authenticate = this.authenticate.bind(this);
    }

    componentDidMount() {
        this.autoLogin();
    }

    autoLogin() {
        const GETtoken = window.location.search.replace('?token=', '');
        let authToken = localStorage.getItem('authToken');

        if (authToken) {
            // if we have a GETtoken as well, link the provider (GETtoken) with
            // the account we are already logged into.
            if (GETtoken) {
                this.props.linkProvider(authToken, GETtoken);
            }

            return this.props.authLogin(authToken);
        }

        if (GETtoken) {
            return this.props.authProvider(GETtoken);
        }

        return this.props.getStrategies();
    }

    authenticate() {
        const state = {...this.state};
        // clear the error message
        this.setState({
            status: null,
        });

        this.props.authLocal(state.email, state.password);
    }

    showStatus() {
        if (!this.state.status) {
            return null;
        }

        return <p className={`alert alert-${this.state.status.isError ? 'danger' : 'success'}`}>
            {this.state.status.message}
        </p>;
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Let's do this!</CardHeader>
                {
                    this.props.strategies &&
                    <CardBody className="text-center">
                        {this.showStatus()}
                        {
                            // if local authentication strategy is enabled
                            this.props.strategies.find((auth) => auth.provider === 'local') &&
                            <Form>
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
                                <FormGroup>
                                    <Input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        onChange={(e) => {
                                            this.setState({
                                                password: e.target.value,
                                            });
                                        }}
                                        value={this.state.password}
                                    />
                                </FormGroup>
                                <Button onClick={this.authenticate} color="primary">Login</Button>
                                <p className="text-right"><Link to="/auth/reset">Forgot password?</Link></p>
                                <hr />
                            </Form>
                        }
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                        {
                            this.props.strategies.map((strat) => {
                                if (strat.provider === 'local') {
                                    return null;
                                }

                                return <a key={strat.provider} className={`btn btn-block btn-primary btn-brand-${strat.provider}`} href={strat.authUrl}>
                                    <FontAwesomeIcon icon={['fab', strat.provider]} /> Login with {strat.name}
                                </a>;
                            })
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
        authLogin,
        authLocal,
        getStrategies,
        linkProvider,
        authProvider,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLogin));
