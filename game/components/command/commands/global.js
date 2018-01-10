import { CHAT_MESSAGE } from '../types';

export default function cmdGlobal(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            Game.socketManager.dispatchToServer({
                type: CHAT_MESSAGE,
                payload: {
                    name: character.name,
                    message: params.join(' '),
                    type: 'global'
                }
            })
        })
        .catch(Game.logger.error)
}