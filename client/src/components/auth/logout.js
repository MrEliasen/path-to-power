import React from 'react';

class AuthLogout extends React.Component {
    constructor(props) {
        super(props);
    }

    // TODO: Move logout logic/state from app/header to this component

    render() {
        return (
            <div className="panel">
                <div className="panel-title">You are now logged out :(</div>
                <div className="panel-body">
                    <p>Sad to see you go. Please come back!</p>
                </div>
            </div>
        );
    }
};

export default AuthLogout;
