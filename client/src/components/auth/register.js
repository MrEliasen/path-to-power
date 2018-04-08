import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import Icon from '@fortawesome/react-fontawesome';
import {Card, CardHeader, CardBody, Input, Button, Form, FormGroup} from 'reactstrap';
import Notification from '../ui/notification';
import {userSignUp, getStrategies} from '../auth/actions';

class AuthRegister extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            strategies: null,
            email: '',
            password: '',
            passwordConfirm: '',
            status: null,
            sending: false,
        };

        this.register = this.register.bind(this);
    }

    componentDidMount() {
        if (!this.props.strategies) {
            this.props.getStrategies();
        }
    }

    register() {
        const state = {...this.state};
        this.props.userSignUp(state.email, state.password, state.passwordConfirm);
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Welcome to the party!</CardHeader>
                {
                    this.props.strategies.length > 0 &&
                    <CardBody className="text-center">
                        <Notification />
                        {
                            // if local authentication strategy is enabled
                            this.props.strategies.find((auth) => auth.id === 'local') &&
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
                                                passwordConfirm: e.target.value,
                                            });
                                        }}
                                        value={this.state.passwordConfirm}
                                    />
                                </FormGroup>
                                <Button onClick={this.register} disabled={this.state.sending} color="primary">Create account</Button>
                                <hr />
                            </Form>
                        }
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                        {
                            this.props.strategies.map((strat) => {
                                if (strat.id === 'local') {
                                    return null;
                                }

                                return <a key={strat.id} className={`btn btn-block btn-primary btn-brand-${strat.id}`} href={this.state.sending ? '#' : strat.authUrl}>
                                    <Icon icon={['fab', strat.id]} /> Sign up with {strat.name}
                                </a>;
                            })
                        }
                    </CardBody>
                }
            </Card>
        );
    }
};

function mapStateToProps(state) {
    return {
        strategies: state.auth.strategies || [],
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        userSignUp,
        getStrategies,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthRegister);
