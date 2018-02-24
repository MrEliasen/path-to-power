import React from 'react';
import ReactMarkdown from 'react-markdown';

class Page extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id={'page' + (this.props.page.meta.path && '-' + this.props.page.meta.path.replace('/', '-'))}>
                <div className="panel">
                    <div className="panel-body">
                        <ReactMarkdown source={this.props.page.markdown} />
                    </div>
                </div>
            </div>
        );
    }
}

export default Page;
