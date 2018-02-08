import { CHAT_MESSAGE } from './types';
import { NEW_EVENT } from '../../types';

function checkChatCooldown (character, Game, callback) {
    // check if the character has an existing cooldown for this action, if they are trying to hide
    const ticksLeft = Game.cooldownManager.ticksLeft(character, 'chat');

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You must wait another ${(ticksLeft / 10)} seconds before you can send another message.`);
    }

    // add the search cooldown to the character
    Game.cooldownManager.add(character, 'chat', null, true);

    // return the new cooldown 
    callback();
}

function cmdGlobal(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // check for cooldowns
            checkChatCooldown(character, Game, () => {
                Game.socketManager.dispatchToServer({
                    type: CHAT_MESSAGE,
                    payload: {
                        player: character.user_id,
                        message: params.join(' '),
                        type: 'global'
                    }
                });
            });
        })
        .catch(() => {})
}

function cmdSay(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // check for cooldowns
            checkChatCooldown(character, Game, () => {
                Game.socketManager.dispatchToRoom(`${character.location.map}_${character.location.y}_${character.location.x}`, {
                    type: NEW_EVENT,
                    payload: {
                        player: character.user_id,
                        message: params.join(' '),
                        type: 'local'
                    }
                });
            });
        })
        .catch(() => {})
}

function cmdWhisper(socket, command, params, Game) {
    if (params.length < 2) {
        return Game.eventToSocket(socket, 'error',  'Invalid whisper. Syntax: /w <username> <message>');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((sender) => {
            // check for cooldowns
            checkChatCooldown(sender, Game, () => {
                const target = params.shift();

                Game.characterManager.getByName(target).then((whisperTarget) => {
                    // send message to the socket
                    Game.socketManager.dispatchToSocket(socket, {
                        type: CHAT_MESSAGE,
                        payload: {
                            type: 'whisper-out',
                            player: whisperTarget.user_id,
                            message: params.join(' ')
                        }
                    });
                    // send message to the target user
                    Game.socketManager.dispatchToUser(whisperTarget.user_id, {
                        type: CHAT_MESSAGE,
                        payload: {
                            type: 'whisper-in',
                            player: sender.user_id,
                            message: params.join(' ')
                        }
                    });
                })
                .catch(() => {
                    Game.eventToSocket(socket, 'error',  'Invalid whisper target.')
                });
            });
        })
        .catch();
}

module.exports = [
    {
        commandKeys: [
            '/global',
            '/g'
        ],
        method: cmdGlobal
    },
    {
        commandKeys: [
            '/say',
            '/s'
        ],
        method: cmdSay
    },
    {
        commandKeys: [
            '/whisper',
            '/w',
            '/tell',
            '/pm'
        ],
        method: cmdWhisper
    },

];