import React from 'react';
import config from '../../config';

class AuthRegister extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="panel">
                <div className="panel-title">Welcome to the party!</div>
                <div className="panel-body">
                    <p></p>
                    <form>
                        <input className="input" type="email" name="email" value="" placeholder="Email" />
                        <input className="input" type="password" name="password" value="" placeholder="Password" />
                        <input className="input" type="password" name="password_repeat" value="" placeholder="Password repeat" />
                        <button>Create account</button>
                    </form>
                    <hr />
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia, laboriosam!</p>
                    <a className="button block" href={`https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=${config.twitch.clientId}&redirect_uri=${config.twitch.callbackUrl}&scope=${config.twitch.scope.join(',')}`}>Login with Twitch.tv</a>
                </div>
            </div>
        );
    }
};

export default AuthRegister;
