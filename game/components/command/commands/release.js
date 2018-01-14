export default function cmdRelease(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // if they do not have a target, simply ignore the command
            if (!character.target) {
                return Game.eventToSocket(socket, 'info', 'You do not have a target.')
            }

            const target = {
                user_id: character.target.user_id,
                name: character.target.name
            }

            // release the gridlock from the target
            character.releaseTarget()
                .then(() => {
                    // let the client know they removed their target
                    Game.eventToSocket(socket, 'info', `You no longer have ${target.name} as your target.`);
                    // get the target know they are no longer aimed at
                    Game.eventToUser(target.user_id, 'info', `${character.name} releases you from their aim.`);
                })
                .catch(Game.logger.error);
        })
        .catch(Game.logger.error)
}