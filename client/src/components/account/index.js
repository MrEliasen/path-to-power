import React from 'react';
import {withRouter, Route, Switch, NavLink} from 'react-router-dom';
import {connect} from 'react-redux';

// Components
import AccountOverview from './overview';
import AccountProfile from './profile';
import AccountSettings from './settings';
import AccountSecurity from './security';
import AccountConnections from './connections';
import AccountNotifications from './notifications';

// UI
import {Row, Col, Card, CardHeader, ListGroup} from 'reactstrap';

class Account extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            return this.props.history.push('/auth');
        }
    }

    render() {
        return (
            <Row>
                <Col sm="3">
                    <Card>
                        <CardHeader>Account</CardHeader>
                        <ListGroup flush>
                            <NavLink exact to="/account" className="list-group-item">Overview</NavLink>
                            <NavLink exact to="/account/profile" className="list-group-item">Profile</NavLink>
                            <NavLink exact to="/account/settings" className="list-group-item">Settings</NavLink>
                            <NavLink exact to="/account/security" className="list-group-item">Login and Security</NavLink>
                            <NavLink exact to="/account/connections" className="list-group-item">Connections</NavLink>
                            <NavLink exact to="/account/notifications" className="list-group-item">Notifications</NavLink>
                        </ListGroup>
                    </Card>
                </Col>
                <Col>
                    <Switch>
                        <Route path="/account/profile" component={AccountProfile} />
                        <Route path="/account/settings" component={AccountSettings} />
                        <Route path="/account/security" component={AccountSecurity} />
                        <Route path="/account/connections" component={AccountConnections} />
                        <Route path="/account/notifications" component={AccountNotifications} />
                        <Route component={AccountOverview} />
                    </Switch>
                </Col>
            </Row>
        );
    }
}

function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
    };
}

export default withRouter(connect(mapStateToProps)(Account));
