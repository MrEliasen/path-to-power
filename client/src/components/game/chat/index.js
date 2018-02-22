import React from 'react';
import {connect} from 'react-redux';

class Chat extends React.Component {
    constructor(props) {
        super(props);
    }

    renderChatMessage(message, index) {
        let prefix = '';
        let sender = message.name;

        switch (message.type) {
            case 'global':
                prefix = '[Global]';
                break;

            case 'whisper-in':
                prefix = ' tells you';
                break;

            case 'whisper-out':
                prefix = 'You tell ';
                break;

            case 'local':
                prefix = '[Local]';
                break;

            case 'faction':
                prefix = '[Faction] ';
                break;
        }

        // if there is no sender, assume its from the Game itself
        if (!message.user_id) {
            sender = 'SYSTEM';
        }

        return <li
            key={index}
            className={`--${message.type}`}
        >
            {prefix} <strong>{sender}</strong>: "{message.message}"
        </li>;
    }

    render() {
        return (
            <ul className="c-chat">
                {
                    this.props.chat &&
                    this.props.chat.map((message, index) => this.renderChatMessage(message, index))
                }
            </ul>
        );
    }
}

function mapStateToProps(state) {
    return {
        chat: state.game ? [...state.game.chat] : null,
    };
}

export default connect(mapStateToProps)(Chat);
