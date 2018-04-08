class Multiline {
    constructor(event) {
        this.event = event;
    }

    parse() {
        return [...this.event.message].map((line) => {
            return {
                ...this.event,
                message: line,
            };
        });
    }
}

export default Multiline;
