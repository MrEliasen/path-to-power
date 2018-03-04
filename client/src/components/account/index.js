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
                <Route path="/account/characters" exact component={characterList} />
                <Route path="/account/characters/new" component={characterNew} />
            </div>
        );
    }
};

export default withRouter(Account);
