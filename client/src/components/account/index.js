import React from 'react';
import {withRouter, Route} from 'react-router-dom';

import characterList from './list';
import characterCreate from './create';

class Account extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="account">
                <Route path="/account/characters" exact component={characterList} />
                <Route path="/account/characters/create" component={characterCreate} />
            </div>
        );
    }
};

export default withRouter(Account);
