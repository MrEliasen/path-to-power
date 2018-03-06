import React from 'react';
import {withRouter, Route} from 'react-router-dom';

import characterList from './list';
import characterNew from './new';

class Account extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="account">
                <Route path="/character/list" exact component={characterList} />
                <Route path="/character/create" component={characterNew} />
            </div>
        );
    }
};

export default withRouter(Account);
