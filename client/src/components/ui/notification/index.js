import React from 'react';
import {connect} from 'react-redux';
import {Alert} from 'reactstrap';

class Notification extends React.Component {
    constructor(props) {
        super(props);
    }

    getType() {
        let type = this.props.notification.type || 'info';

        // convert to react-strap "error" class name, "danger"
        if (type === 'error') {
            type = 'danger';
        }

        return type;
    }

    render() {
        if (!this.props.notification) {
            return null;
        }

        return (
            <Alert color={this.getType()}>{this.props.notification.message}</Alert>
        );
    }
}

function mapStateToProps(state) {
    return {
        notification: state.app.notification,
    };
}

export default connect(mapStateToProps)(Notification);
