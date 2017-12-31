import parseCommand from '../index';


export function execCommand(action, socket) {
    return (dispatch, getState, io) => {
        const request = parseCommand(socket, action, getState);

        request
            .then((toDispatch) => {
                if (!toDispatch) {
                    return;
                }

                toDispatch.map(dispatch)
            })
            .catch(console.log)

        return request;
    }
}