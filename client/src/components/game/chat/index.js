import React from 'react';
import {connect} from 'react-redux';
import {Card, CardHeader} from 'reactstrap';
import Icon from '@fortawesome/react-fontawesome';

class Chat extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            autoScroll: true,
            timestamp: true,
        };

        this.height = (this.props.lines || 10) * 16;
    }

    componentDidUpdate(prevProps) {
        if (this.state.autoScroll) {
            this.$cardBody.scrollTop = this.$cardBody.scrollHeight;
        }
    }

    renderMessage(message, index) {
        let prefix = '';

        // Unfortunately there's no timestamp in the game yet
        // TODO: Add timestamp to the messages on the server?
        let date = new Date();
        let time = [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');

        switch (message.type) {
            case 'global':
                prefix = '[Global]';
                break;
            case 'whisper-in':
                prefix = '[Whisper] from ';
                break;
            case 'whisper-out':
                prefix = '[Whisper] to ';
                break;
            case 'local':
                prefix = '[Local]';
                break;
            case 'faction':
                prefix = '[Faction]';
                break;
        }

        // if there is no sender, assume its from the Game itself
        // if (! message.user_id) {
        //     sender = 'SYSTEM';
        // }

        if (message.type === 'separator') {
            return <li key={index} className='chat-separator'></li>;
        }

        return (
            <li key={index} className={'chat-' + message.type}>
                {false && <span className="timestamp">{time}</span>}
                <span className="prefix">{prefix}</span>
                {
                    message.name &&
                    <span
                        className="name"
                        onClick={() => this.props.setCommand(`/whisper ${message.name} `)}
                    >
                        {message.name}:
                    </span>
                }
                <span className="message">{message.message}</span>
            </li>
        );
    }

    render() {
        return (
            <Card className="card-chat">
                <CardHeader>
                    <div className="float-right"><Icon icon="cog" /></div>
                    {this.props.title || 'Chat'}
                </CardHeader>
                <div
                    className="card-body messages"
                    ref={($elm) => {
                        this.$cardBody = $elm;
                    }}
                    style={
                        {height: this.height + 'px'}
                    }
                >
                    <ul>
                        {
                            ! this.props.messages.length &&
                            <li>Nothing has happened yet.</li>
                        }
                        {
                            this.props.messages.length > 0 &&
                            this.props.messages.map((message, index) => this.renderMessage(message, index))
                        }
                    </ul>
                </div>
            </Card>
        );
    }
}

function mapStateToProps(state) {
    return {
        chat: state.game ? [...state.game.chat] : null,
    };
}

export default connect(mapStateToProps)(Chat);
