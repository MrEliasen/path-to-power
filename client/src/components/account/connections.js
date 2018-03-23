import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {withRouter} from 'react-router-dom';

// UI
import {Card, CardHeader, CardBody, Table} from 'reactstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

// Actions
import {unlinkProvider} from '../auth/actions';

class AccountConnections extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let authOther = this.props.strategies.filter((strat) => strat.id !== 'local');

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
                            {
                                authOther && authOther.length > 0 &&
                                authOther.map((strat) => {
                                    const isLinked = this.props.user.identities.find((obj) => obj.provider === strat.id);
                                    return <tr key={strat.id}>
                                        <td width="50"><FontAwesomeIcon icon={['fab', strat.id]} size="2x" /></td>
                                        <td>{strat.name}</td>
                                        <td></td>
                                        <td className="text-right">
                                            {
                                                isLinked &&
                                                <a
                                                    href="#"
                                                    onClick={() => this.props.unlinkProvider(
                                                        this.props.user._id,
                                                        this.props.authToken,
                                                        strat.id
                                                    )}
                                                    className="btn btn-link btn-sm"
                                                >
                                                    Disconnect
                                                </a>
                                            }
                                            {
                                                !isLinked &&
                                                <a href={strat.authUrl} className="btn btn-primary btn-sm">Connect</a>
                                            }
                                        </td>
                                    </tr>;
                                })
                            }
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        strategies: state.auth.strategies || [],
        user: state.account.user,
        authToken: state.account.authToken,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        unlinkProvider,
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AccountConnections));
