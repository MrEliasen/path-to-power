import React from 'react';
import {connect} from 'react-redux';
import Chat from '../chat';

// event types
import StructureInfo from './eventtypes/structureinfo';
import CommandError from './eventtypes/commanderror';
import SystemEvent from './eventtypes/systemevent';
import CommandList from './eventtypes/commandlist';
import Multiline from './eventtypes/multiline';
import GridDetails from './eventtypes/griddetails';

class Events extends React.Component {
    constructor(props) {
        super(props);
    }

    renderEvents() {
        let events = [];
        this.props.events.forEach((event, index) => {
            if (event.ignore && event.ignore.includes(this.props.user_id)) {
                return;
            }

            events.push({
                type: 'separator',
            });

            switch (event.type) {
                case 'structure-info':
                    events = events.concat(new StructureInfo(event, this.props.commandlist, this.props.maps).parse());
                    break;

                case 'command-error':
                    events = events.concat(new CommandError(event).parse());
                    break;

                case 'system':
                    events = events.concat(new SystemEvent(event).parse());
                    break;

                case 'commandlist':
                    events = events.concat(new CommandList(event, this.props.commandlist).parse());
                    break;

                case 'multiline':
                    events = events.concat(new Multiline(event).parse());
                    break;

                case 'grid-details':
                    events = events.concat(new GridDetails(event, this.props.itemList).parse());
                    break;
                default:
                    events.push(event);
            }
        });

        return events;
    }

    render() {
        return <Chat title="Events" messages={this.renderEvents()} lines="16" />;
    }
}

function mapStateToProps(state) {
    return {
        user_id: state.account.user._id,
        events: [...state.events],
        maps: {...state.game.maps},
        itemList: {...state.game.items},
        location: {...state.character.selected.location},
        commandlist: {...state.game.commands},
    };
}

export default connect(mapStateToProps)(Events);
