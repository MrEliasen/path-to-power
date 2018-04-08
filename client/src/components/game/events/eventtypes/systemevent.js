import React from 'react';

class SystemEvent {
    constructor(event) {
        this.event = event;
    }

    parse() {
        return [{
            ...this.event,
            message: <span className="alert-warning">{this.event.message}</span>,
        }];
    }
}

export default SystemEvent;
