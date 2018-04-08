import React from 'react';
import {Card, CardHeader, CardBody, Alert} from 'reactstrap';

class Verified extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
        };

        this.getStatus = this.getStatus.bind(this);
    }

    componentDidMount() {
        const url = new URL(document.location);
        const error = url.searchParams.get('error');

        this.setState({
            error: error || null,
        });
    }

    getStatus() {
        const {error} = this.state;

        if (error) {
            return <Alert color="danger">{error}</Alert>;
        }

        return <Alert color="success">Your new email has been verfied! Thank you.</Alert>;
    }

    render() {
        return (
            <Card className="card-small">
                <CardHeader>Email Verification</CardHeader>
                <CardBody className="text-center">
                    {this.getStatus()}
                </CardBody>
            </Card>
        );
    }
};

export default Verified;
