import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';

class Account extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        if (!this.props.loggedIn) {
            this.props.history.push('/auth');
        }
    }

    render() {
        return (
            <div id="account">
                <p>Your account.</p>
            </div>
        );
    }
};

function mapStateToProps(state) {
    return {
        loggedIn: state.account.loggedIn,
    };
}

export default withRouter(connect(mapStateToProps)(Account));
