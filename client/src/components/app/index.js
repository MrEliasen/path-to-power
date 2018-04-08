import React from 'react';
import {bindActionCreators} from 'redux';
import {withRouter, Route, Switch} from 'react-router-dom';
import {connect} from 'react-redux';
import Yaml from 'js-yaml';

// Components
import Page from '../page';
import PageNotFound from '../page/404';
import AuthContainer from '../auth';
import GameContainer from '../game';
import AccountContainer from '../account';
import Header from './header';

// UI
import {Container} from 'reactstrap';
import Icon from '@fortawesome/react-fontawesome';
import Loading from '../ui/loading';

// Redux
import {socketConnect} from './actions';
import Verified from '../verified';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pages: [],
        };
    }

    componentWillMount() {
        this.getPages();
        this.generateIssueLink();
    }

    componentDidMount() {
        this.props.socketConnect();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.character && !this.props.character) {
            this.generateIssueLink();
        }

        // if the user is logged in, and the socket reconnected, re-authticate..
        if (this.props.loggedIn && !this.props.isConnected && nextProps.isConnected) {
            this.props.history.push('/auth');
        }
    }

    parsePageMeta(str) {
        if (str.slice(0, 3) !== '---') return;

        const matcher = /\n(\.{3}|-{3})/g;
        const metaEnd = matcher.exec(str);

        return metaEnd && [str.slice(0, metaEnd.index), str.slice(matcher.lastIndex)];
    }

    getPages() {
        const pages = [];
        const webpackRequireContext = require.context(
            '!raw-loader!../../pages',
            false,
            /\.md$/,
        );

        webpackRequireContext.keys().forEach((fileName) => {
            const file = webpackRequireContext(fileName);
            const page = {
                raw: file,
                meta: null,
                markdown: '',
            };

            if (! page.raw) return;

            const split = this.parsePageMeta(page.raw);
            if (split) {
                page.meta = Yaml.safeLoad(split[0]);
                page.markdown = split[1];
            }

            pages.push(page);
        });

        pages.sort((pageA, pageB) => {
            return (pageA.meta.path > pageB.meta.path) ? 1 : 0;
        });

        this.setState({pages});
    }

    generateIssueLink() {
        fetch('https://raw.githubusercontent.com/MrEliasen/path-to-power/master/.github/ISSUE_TEMPLATE.md')
            .then((response) => response.text())
            .then((text) => {
                // replace static information
                text = text.replace('**Operating System**:', `**Operating System**: ${window.navigator.platform}`);
                text = text.replace('**Browser/Version**:', `**Browser/Version**: ${window.navigator.userAgent}`);

                if (this.props.character) {
                    text = text.replace('**In-Game Name**: (if applicable)', `**In-Game Name**: ${this.props.character.name}`);
                }

                this.setState({
                    issueUrl: `https://github.com/MrEliasen/path-to-power/issues/new?body=${encodeURIComponent(text)}`,
                });
            })
            .catch((err) => {
            });
    }

    renderGameRoute(component) {
        if (!this.props.isConnected) {
            return <p>Connecting...</p>;
        }

        return component;
    }

    render() {
        return (
            <React.Fragment>
                <Header pages={this.state.pages} />
                <main id="main">
                    <Container>
                        <Switch>
                            {
                                this.state.pages.map((page, index) => {
                                    return <Route exact path={'/' + page.meta.path} key={index} component={() => {
                                        return <Page page={page}/>;
                                    }} />;
                                })
                            }
                            <Route path="/auth" render={() => this.renderGameRoute(<AuthContainer/>)} />
                            <Route path="/verified" component={Verified} />
                            <Route path="/game" render={() => this.renderGameRoute(<GameContainer/>)} />
                            <Route path="/account" render={() => this.renderGameRoute(<AccountContainer/>)} />
                            <Route component={PageNotFound} />
                        </Switch>
                    </Container>
                </main>
                <a href={this.state.issueUrl} target="_blank" className="btn btn-primary" id="bug"><Icon icon="bug" />Found a bug?</a>
                <Loading />
            </React.Fragment>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        socketConnect,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        isConnected: state.app.connected,
        loggedIn: state.account.loggedIn || false,
        character: state.character.selected,
    };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
