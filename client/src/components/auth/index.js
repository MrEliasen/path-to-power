import React from 'react';
import {withRouter, Route} from 'react-router-dom';

import AuthLogin from './login';
import AuthRegister from './register';

class Auth extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="auth">
                <Route path="/auth" exact component={AuthLogin} />
                <Route path="/auth/register" component={AuthRegister} />
            </div>
        );
    }
};

export default withRouter(Auth);
