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
                <CardHeader>You have been logged out</CardHeader>
                <CardBody>
                    <p>Sad to see you go, but hope to see you again some other time!</p>
                </CardBody>
            </Card>
        );
    }
};

export default AuthLogout;
