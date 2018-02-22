import React from 'react';
import config from '../../config';

class AuthRegister extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="panel">
                <h1>Create account</h1>
                <p>...</p>
                <hr />
                <a href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}>Login with Twitch.tv</a>
            </div>
        );
    }
};

export default AuthRegister;
