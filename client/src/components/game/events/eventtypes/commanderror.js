import React from 'react';

class CommandError {
    constructor(event) {
        this.event = event;
    }

    parse() {
        return [{
            ...this.event,
            message: <span className="alert-danger">{this.event.message}</span>,
        }];
    }
}

export default CommandError;
