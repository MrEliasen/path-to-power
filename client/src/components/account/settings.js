import React from 'react';

// UI
import {Col, Card, CardHeader, CardBody, Button, Form, FormGroup, Label, Input} from 'reactstrap';

class AccountSettings extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <CardHeader>Settings</CardHeader>
                <CardBody>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate minus dignissimos earum alias enim pariatur veritatis qui veniam quo, facilis perferendis quod praesentium dolorum consectetur nihil, reprehenderit, laborum eum? Ipsa!</p>
                    <hr/>
                    <Form>
                        <FormGroup row>
                            <Label for="settings-language" sm="3">Language</Label>
                            <Col col="9">
                                <Input type="select" name="language" id="settings-language">
                                    <option>Select option</option>
                                </Input>
                            </Col>
                        </FormGroup>
                        <FormGroup row>
                            <Label for="settings-timezone" sm="3">Timezone</Label>
                            <Col col="9">
                                <Input type="select" name="timezone" id="settings-timezone">
                                    <option>Select option</option>
                                </Input>
                            </Col>
                        </FormGroup>
                        <FormGroup row>
                            <Label for="settings-timestamp" sm="3">Timestamp</Label>
                            <Col col="9">
                                <Input name="timestamp" id="settings-timestamp" placeholder="hh:mm:ss" />
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

export default AccountSettings;
