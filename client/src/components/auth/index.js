import React from 'react';
import {withRouter, Route} from 'react-router-dom';

import AuthLogin from './login';
import AuthRegister from './register';
import AuthLogout from './logout';

class Auth extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="auth">
                <Route path="/auth" exact component={AuthLogin} />
                <Route path="/auth/register" component={AuthRegister} />
                <Route path="/auth/logout" component={AuthLogout} />
            </div>
        );
    }
};

export default withRouter(Auth);
