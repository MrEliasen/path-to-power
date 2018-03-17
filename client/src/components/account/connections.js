import React from 'react';

// UI
import {Card, CardHeader, CardBody, Table} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

class AccountConnections extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <CardHeader>Connections</CardHeader>
                <CardBody>
                    <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quis consequatur similique velit autem, cum quam commodi enim iure corrupti blanditiis perspiciatis nihil ea doloremque fuga aliquid est sint veniam mollitia.</p>
                    <p>Columns are: Platform Icon, Name, Description/Details, Status/Action</p>
                    <Table striped>
                        <thead>
                            <tr>
                                <th colSpan="3">Platform</th>
                                <th width="50" className="text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td width="50"><FontAwesomeIcon icon={['fab', 'facebook']} size="2x" /></td>
                                <td>Facebook</td>
                                <td></td>
                                <td className="text-right"><a href="#" className="btn btn-link btn-sm">Disconnect</a></td>
                            </tr>
                            <tr>
                                <td><FontAwesomeIcon icon={['fab', 'twitter']} size="2x" /></td>
                                <td>Twitter</td>
                                <td></td>
                                <td className="text-right"><a href="#" className="btn btn-link btn-sm">Disconnect</a></td>
                            </tr>
                            <tr>
                                <td><FontAwesomeIcon icon={['fab', 'google-plus']} size="2x" /></td>
                                <td>Google+</td>
                                <td></td>
                                <td className="text-right"><a href="#" className="btn btn-primary btn-sm">Connect</a></td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        );
    }
}

export default AccountConnections;
