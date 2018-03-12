import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import axios from 'axios';
import config from '../../config';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {Card, CardHeader, CardBody, Input, Button, Form, FormGroup} from 'reactstrap';
import Notification from '../ui/notification';
import {userSignUp} from '../account/actions';

class AuthRegister extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            strategies: null,
            email: '',
            password: '',
            passwordRepeat: '',
            status: null,
            sending: false,
        };

        this.register = this.register.bind(this);
    }

    componentWillMount() {
        this.fetchAuthStrategies();
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

    register() {
        const state = {...this.state};
        this.props.userSignUp(state.email, state.password);
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Welcome to the party!</CardHeader>
                {
                    this.state.strategies &&
                    <CardBody className="text-center">
                        <Notification />
                        {
                            // if local authentication strategy is enabled
                            this.state.strategies.find((auth) => auth.provider === 'local') &&
                            <Form>
                                <FormGroup>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        autoComplete="email"
                                        disabled={this.state.sending}
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
                                        autoComplete="new-password"
                                        disabled={this.state.sending}
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
                                        name="password_repeat"
                                        placeholder="Password repeat"
                                        autoComplete="new-password"
                                        disabled={this.state.sending}
                                        onChange={(e) => {
                                            this.setState({
                                                passwordRepeat: e.target.value,
                                            });
                                        }}
                                        value={this.state.passwordRepeat}
                                    />
                                </FormGroup>
                                <Button onClick={this.register} disabled={this.state.sending} color="primary">Create account</Button>
                                <hr />
                            </Form>
                        }
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                        {
                            this.state.strategies.map((strat) => {
                                if (strat.provider === 'local') {
                                    return null;
                                }

                                return <a key={strat.provider} className={`btn btn-block btn-primary btn-brand-${strat.provider}`} href={this.state.sending ? '#' : strat.authUrl}>
                                    <FontAwesomeIcon icon={['fab', strat.provider]} /> Sign up with {strat.name}
                                </a>;
                            })
                        }
                    </CardBody>
                }
            </Card>
        );
    }
};

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        userSignUp,
    }, dispatch);
}

export default connect(null, mapDispatchToProps)(AuthRegister);
