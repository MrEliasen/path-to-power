import React from 'react';

// UI
import {Card, CardHeader, CardBody, Table} from 'reactstrap';

class AccountNotifications extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Card>
                <CardHeader>Notifications</CardHeader>
                <CardBody>
                    <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ad quia earum, nostrum aspernatur totam vero rem, cum vitae cupiditate aliquam harum adipisci non eaque nesciunt, velit error consequatur nobis maiores?</p>
                    <Table striped>
                        <tbody>
                            <tr>
                                <td>
                                    News & Updates<br />
                                    <small>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolore in vero impedit velit sequi est.</small>
                                </td>
                                <td className="text-right"><a href="#" className="btn btn-link btn-sm">Disable</a></td>
                            </tr>
                            <tr>
                                <td>
                                    Security issues<br />
                                    <small>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Delectus iure aliquid aut quisquam dolore iusto esse accusantium consequatur temporibus ducimus?</small>
                                </td>
                                <td className="text-right"><a href="#" className="btn btn-primary btn-sm">Enable</a></td>
                            </tr>
                            <tr>
                                <td>
                                    Friend Requests<br />
                                    <small>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Fugiat, quas architecto facere, dicta dolorum exercitationem iste obcaecati voluptate alias consectetur repudiandae sapiente dignissimos delectus voluptatum sunt. Id tempore veniam eius.</small>
                                </td>
                                <td className="text-right"><a href="#" className="btn btn-primary btn-sm">Enable</a></td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        );
    }
}

export default AccountNotifications;
