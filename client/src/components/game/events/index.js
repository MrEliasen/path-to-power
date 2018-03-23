import React from 'react';
import {connect} from 'react-redux';
import Chat from '../chat';

class Events extends React.Component {
    constructor(props) {
        super(props);
    }

    generateDescription(command, modOverwrites) {
        let description = this.props.commandlist[command].description || '';
        let modifiers = this.props.commandlist[command].modifiers || {};
        Object.assign(modifiers, modOverwrites);

        switch (command) {
            case '/travel':
                const destinations = Object.keys(modifiers.destinations).map((mapId) => {
                    return `${this.props.maps[mapId].name} (${modifiers.destinations[mapId].cost})`;
                });

                description = `${description} Available destinations: ${destinations.join(', ')}`;
                break;

            default:
                Object.keys(modifiers).map((key) => {
                    const exp = new RegExp(`({${key}})+`, 'gi');
                    description = description.replace(exp, modifiers[key]);
                });
                break;
        }

        return description;
    }

    buildingInfo(event) {
        const lines = [];

        if (! event.structure) {
            return lines;
        }

        lines.push(
            <React.Fragment>
                The following is available in the <span style={{color: event.structure.colour}}>[{ event.structure.name }]</span>:
            </React.Fragment>
        );


        if (event.structure.commands) {
            lines.push(
                <React.Fragment>
                    <strong>Commands</strong>
                </React.Fragment>
            );

            Object.keys(event.structure.commands).forEach((command) => {
                lines.push(
                    <React.Fragment>
                        <i>{command}</i>: {this.generateDescription(command, event.structure.commands[command])}
                    </React.Fragment>
                );
            });
        }

        if (event.structure.shops) {
            lines.push(
                <React.Fragment>
                    <strong>Shops</strong>
                </React.Fragment>
            );

            event.structure.shops.forEach((shop) => {
                lines.push(
                    <React.Fragment>
                        /shop <i>{shop.name}</i>: {shop.description}
                    </React.Fragment>
                );
            });
        }

        return lines;
    }

    generateCommandList() {
        let lines = [];

        Object.keys(this.props.commandlist).sort().map((command) => {
            let commandObj = this.props.commandlist[command];

            lines.push(
                <React.Fragment>
                    <strong>{command}</strong>:&nbsp;{commandObj.description}&nbsp;
                </React.Fragment>
            );

            if (commandObj.aliases && commandObj.aliases.length > 0) {
                lines.push(
                    <React.Fragment>
                        <strong>(aliases: {commandObj.aliases.join(', ')})</strong>
                    </React.Fragment>
                );
            }
        });

        return lines;
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
                    this.buildingInfo(event).forEach((line) => {
                        events.push({
                            ...event,
                            message: line,
                        });
                    });
                    break;
                case 'command-error':
                    events.push({
                        ...event,
                        message: <span className="alert-danger">{event.message}</span>,
                    });
                    break;
                case 'system':
                    events.push({
                        ...event,
                        message: <span className="alert-warning">{event.message}</span>,
                    });
                    break;
                case 'commandlist':
                    this.generateCommandList().forEach((line) => {
                        events.push({
                            ...event,
                            message: line,
                        });
                    });
                    break;
                case 'multiline':
                    [...event.message].forEach((line) => {
                        events.push({
                            ...event,
                            message: line,
                        });
                    });
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
        commandlist: {...state.game.commands},
    };
}

export default connect(mapStateToProps)(Events);
