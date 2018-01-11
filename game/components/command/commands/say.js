import { NEW_EVENT } from '../../../types';

export default function cmdSay(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            Game.socketManager.dispatchToRoom(`${character.location.map}_${character.location.y}_${character.location.x}`, {
                type: NEW_EVENT,
                payload: {
                    name: character.name,
                    message: params.join(' '),
                    type: 'local'
                }
            })
        })
        .catch(Game.logger.error)
}