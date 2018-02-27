import React from 'react';

class AuthLogout extends React.Component {
    constructor(props) {
        super(props);
    }

    // TODO: Move logout logic/state from app/header to this component

    render() {
        return (
            <div className="card">
                <div className="card-header">You are now logged out :(</div>
                <div className="card-body">
                    <p>Sad to see you go. Please come back!</p>
                </div>
            </div>
        );
    }
};

export default AuthLogout;
