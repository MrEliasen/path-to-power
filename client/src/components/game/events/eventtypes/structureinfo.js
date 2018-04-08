import React from 'react';

class StructureInfo {
    constructor(event, commandlist, maps) {
        this.commandlist = commandlist;
        this.maps = maps;
        this.event = event;
    }

    generateDescription(command, modOverwrites) {
        let description = this.commandlist[command].description || '';
        let modifiers = this.commandlist[command].modifiers || {};
        Object.assign(modifiers, modOverwrites);

        switch (command) {
            case '/travel':
                const destinations = Object.keys(modifiers.destinations).map((mapId) => {
                    return `${this.maps[mapId].name} (${modifiers.destinations[mapId].cost})`;
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

    buildingInfo() {
        const lines = [];

        if (!this.event.structure) {
            return lines;
        }

        lines.push(
            <React.Fragment>
                The following is available in the <span style={{color: this.event.structure.colour}}>[{ this.event.structure.name }]</span>:
            </React.Fragment>
        );

        if (this.event.structure.commands && Object.keys(this.event.structure.commands).length) {
            lines.push(
                <React.Fragment>
                    <strong>Commands</strong>
                </React.Fragment>
            );

            Object.keys(this.event.structure.commands).forEach((command) => {
                lines.push(
                    <React.Fragment>
                        <i>{command}</i>: {this.generateDescription(command, this.event.structure.commands[command])}
                    </React.Fragment>
                );
            });
        }

        if (this.event.structure.shops && this.event.structure.shops.length) {
            lines.push(
                <React.Fragment>
                    <strong>Shops</strong>
                </React.Fragment>
            );

            this.event.structure.shops.forEach((shop) => {
                lines.push(
                    <React.Fragment>
                        /shop <i>{shop.name}</i>: {shop.description}
                    </React.Fragment>
                );
            });
        }

        return lines;
    }

    parse() {
        return this.buildingInfo().map((line) => {
            return {
                ...event,
                message: line,
            };
        });
    }
}

export default StructureInfo;
