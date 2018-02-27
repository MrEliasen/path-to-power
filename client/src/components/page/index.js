import React from 'react';
import ReactMarkdown from 'react-markdown';
import {Card, CardBody} from 'reactstrap';

class Page extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id={'page' + (this.props.page.meta.path && '-' + this.props.page.meta.path.replace('/', '-'))}>
                <Card>
                    <CardBody>
                        <ReactMarkdown source={this.props.page.markdown} />
                    </CardBody>
                </Card>
            </div>
        );
    }
}

export default Page;
