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

        if (event.structure.commands && Object.keys(event.structure.commands).length) {
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

        if (event.structure.shops && event.structure.shops.length) {
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
                case 'grid-details':
                    events.push({
                        message: <strong>Location:</strong>,
                    });
                    events.push({
                        message: `N${event.location.y} E${event.location.x}`,
                    });

                    if (event.players.length) {
                        let playerlist = [];
                        events.push({
                            message: <strong>Players:</strong>,
                        });

                        event.players.forEach((player) => {
                            playerlist.push(player.name);
                        });

                        events.push({
                            message: playerlist.join(', '),
                        });
                    }

                    if (event.npcs.length) {
                        let npclist = [];
                        events.push({
                            message: <strong>NPCs:</strong>,
                        });

                        event.npcs.forEach((npc) => {
                            npclist.push(`${npc.name} the ${npc.type}`);
                        });

                        events.push({
                            message: npclist.join(', '),
                        });
                    }

                    if (event.items.length) {
                        let items = [];
                        events.push({
                            message: <strong>Items:</strong>,
                        });

                        event.items.forEach((item) => {
                            const itemObj = this.props.itemList[item.id];
                            items.push(`${(itemObj.stats.stackable ? `(${item.durability}) ` : '')}${itemObj.name}`);
                        });

                        events.push({
                            message: items.join(', '),
                        });
                    }

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
