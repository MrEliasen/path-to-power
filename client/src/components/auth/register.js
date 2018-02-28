import React from 'react';
import config from '../../config';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {Card, CardHeader, CardBody, Input, Button, FormGroup} from 'reactstrap';

class AuthRegister extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Welcome to the party!</CardHeader>
                <CardBody className="text-center">
                    <form>
                        <FormGroup>
                            <Input type="email" name="email" value="" placeholder="Email" autoComplete="email" />
                        </FormGroup>
                        <FormGroup>
                            <Input type="password" name="password" value="" placeholder="Password" autoComplete="new-password" />
                        </FormGroup>
                        <FormGroup>
                            <Input type="password" name="password_repeat" value="" placeholder="Password repeat" autoComplete="new-password" />
                        </FormGroup>
                        <Button color="primary">Create account</Button>
                    </form>
                    <hr />
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                    <a className="btn btn-block btn-primary btn-brand-twitch" href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}>
                        <FontAwesomeIcon icon={['fab', 'twitch']} /> Login with Twitch.tv
                    </a>
                </CardBody>
            </Card>
        );
    }
};

export default AuthRegister;
