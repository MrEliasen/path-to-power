import React from 'react';
import {connect} from 'react-redux';

// UI
import Paper from 'material-ui/Paper';

class Events extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            autoscroll: true,
        };

        this.renderEvent = this.renderEvent.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.state.autoscroll) {
            const elem = document.getElementsByClassName('c-game__events')[0];
            elem.scrollTop = elem.scrollHeight;
        }
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

    buildingInfo(event, index) {
        return <div key={index}>
            <p>
                The following is available in the <span style={{color: event.structure.colour}}>
                    [{ event.structure.name }]
                </span>:
            </p>
            {
                event.structure.commands &&
                <React.Fragment>
                    <strong>Commands</strong>
                    {
                        Object.keys(event.structure.commands).map((command) =>
                            <p key={command}>
                                <i>{command}</i>: {
                                    this.generateDescription(
                                        command,
                                        event.structure.commands[command]
                                    )
                                }
                            </p>
                        )
                    }
                </React.Fragment>
            }
            {
                event.structure.shops &&
                <React.Fragment>
                    <strong>Shops</strong>
                    {
                        event.structure.shops.map((shop) =>
                            <p key={shop.id}>
                                /shop <i>{shop.name}</i>: {shop.description}
                            </p>
                        )
                    }
                </React.Fragment>
            }
        </div>;
    }

    generateCommandList() {
        const commands = Object.keys(this.props.commandlist);

        return commands.sort().map((command) => {
            let commandObj = this.props.commandlist[command];

            return <p key={command}>
                <strong>{command}</strong>:&nbsp;
                {commandObj.description}&nbsp;
                {
                    commandObj.aliases &&
                    commandObj.aliases.length > 0 &&
                    <strong>(aliases: {commandObj.aliases.join(', ')})</strong>
                }
            </p>;
        });
    }

    renderEvent(event, index) {
        switch (event.type) {
            case 'structure-info':
                return this.buildingInfo(event, index);
            case 'command-error':
                return <p className="alert-danger">{event.message}</p>;
            case 'system':
                return <p className="alert-warning">{event.message}</p>;
            case 'commandlist':
                return this.generateCommandList();
            case 'multiline':
                return event.message.map((msg, subIndex) =>
                    <p key={subIndex}>{msg}</p>
                );
        }

        return <p>{event.message}</p>;
    }

    render() {
        return (
            <Paper
                zDepth={1}
                rounded={true}
                className="c-game__events e-padding"
            >
                {
                    this.props.events &&
                    this.props.events.map((event, index) => <React.Fragment key={index}>
                        <div className="event-sparator"></div>
                        {this.renderEvent(event, index)}
                    </React.Fragment>)
                }
            </Paper>
        );
    }
}

function mapStateToProps(state) {
    return {
        events: [...state.events],
        maps: {...state.game.maps},
        commandlist: {...state.game.commands},
    };
}

export default connect(mapStateToProps)(Events);
