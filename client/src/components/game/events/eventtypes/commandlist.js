import React from 'react';

class CommandList {
    constructor(event, commandlist) {
        this.event = event;
        this.commandlist = commandlist;
    }

    generateCommandList() {
        let lines = [];

        Object.keys(this.commandlist).sort().map((command) => {
            let commandObj = this.commandlist[command];

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

    parse() {
        return this.generateCommandList().map((line) => {
            return {
                ...this.event,
                message: line,
            };
        });
    }
}


export default CommandList;
