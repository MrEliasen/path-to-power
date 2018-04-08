import React from 'react';

class SystemEvent {
    constructor(event) {
        this.event = event;
    }

    parse() {
        return [{
            ...this.event,
            message: <span style={this.event.colour}>{this.event.message}</span>,
        }];
    }
}

export default SystemEvent;
