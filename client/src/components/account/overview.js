import React from 'react';

// UI
import {Card, CardHeader, CardBody} from 'reactstrap';

class AccountDetails extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <CardHeader>Your account</CardHeader>
                <CardBody>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis aliquid, id inventore ad assumenda, fuga corporis veniam nesciunt excepturi reprehenderit laborum, debitis sapiente! Quisquam, exercitationem sint officiis omnis pariatur eligendi?</p>
                </CardBody>
            </Card>
        );
    }
}

export default AccountDetails;
