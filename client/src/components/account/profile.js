import React from 'react';

// UI
import {Col, Card, CardHeader, CardBody, Button, Form, FormGroup, Label, Input} from 'reactstrap';

class AccountProfile extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <CardHeader>Profile</CardHeader>
                <CardBody>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto eligendi quidem totam ea adipisci, ad vero provident quos ducimus pariatur atque repudiandae est autem distinctio magni aliquam recusandae tempora qui.</p>
                    <hr/>
                    <Form>
                        <FormGroup row>
                            <Label for="user-firstname" sm="3">First Name</Label>
                            <Col col="9">
                                <Input name="firstname" id="user-firstname" placeholder="First Name..." />
                            </Col>
                        </FormGroup>
                        <FormGroup row>
                            <Label for="user-lastname" sm="3">Last Name</Label>
                            <Col col="9">
                                <Input name="lastname" id="user-lastname" placeholder="Last Name..." />
                            </Col>
                        </FormGroup>
                        <FormGroup row>
                            <Col sm={{size: 9, offset: 3}}>
                                <Button color="primary">Save changes</Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </CardBody>
            </Card>
        );
    }
}

export default AccountProfile;
