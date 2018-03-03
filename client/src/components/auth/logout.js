import React from 'react';
import {Card, CardHeader, CardBody} from 'reactstrap';

class AuthLogout extends React.Component {
    constructor(props) {
        super(props);
    }

    // TODO: Move logout logic/state from app/header to this component
    render() {
        return (
            <Card className="card-small">
                <CardHeader>You are now logged out :(</CardHeader>
                <CardBody>
                    <p>Sad to see you go. Please come back!</p>
                </CardBody>
            </Card>
        );
    }
};

export default AuthLogout;
