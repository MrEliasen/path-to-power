import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import axios from 'axios';
import config from '../../config';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {Card, CardHeader, CardBody, Input, Button, FormGroup} from 'reactstrap';

// Actions
import {authLogin} from '../account/actions';
import {ACCOUNT_AUTHENTICATE} from '../account/types';

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
        this.fetchAuthStrategies();
        this.autoLogin();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.loggedIn) {
            this.props.history.push('/account');
        }

        // check if the client has already logged in
        if (!this.props.authToken && nextProps.authToken) {
            this.authenticateSocket(nextProps.authToken);
        }
    }

    fetchAuthStrategies() {
        axios.get(`${config.api.host}/api/auth`)
            .then((response) => {
                this.setState({
                    strategies: response.data.authlist,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }

    autoLogin() {
        const GETtoken = window.location.search.replace('?token=', '');

        if (GETtoken) {
            return this.saveAuthToken(GETtoken);
        }

        let authToken = localStorage.getItem('authToken');

        if (!authToken) {
            return;
        }

        this.props.authLogin(authToken);
    }

    saveAuthToken(authToken) {
        localStorage.setItem('authToken', authToken);
        this.props.authLogin(authToken);
    }

    authenticate() {
        const state = {...this.state};
        // clear the error message
        this.setState({
            status: null,
        });

        axios
            .post(`${config.api.host}/api/auth`, {
                email: state.email,
                password: state.password,
                method: 'local',
            })
            .then((response) => {
                this.saveAuthToken(response.data.authToken);
            })
            .catch((err) => {
                let errorMsg = 'Something went wrong. Please try again in a moment.';

                if (err.response) {
                    errorMsg = err.response.data.error || errorMsg;
                }

                this.setState({
                    status: {
                        message: errorMsg,
                        isError: true,
                    },
                });
            });
    }

    authenticateSocket(token) {
        this.props.socket.emit('dispatch', {
            type: ACCOUNT_AUTHENTICATE,
            payload: token,
        });
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
                    this.state.strategies &&
                    <CardBody className="text-center">
                        {this.showStatus()}
                        {
                            // if local authentication strategy is enabled
                            this.state.strategies.find((auth) => auth.provider === 'local') &&
                            <React.Fragment>
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
                                <hr />
                            </React.Fragment>
                        }
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                        {
                            this.state.strategies.map((strat) => {
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
                    !this.state.strategies &&
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
        socket: state.app.socket,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        authLogin,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLogin));
