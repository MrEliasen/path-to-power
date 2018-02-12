import {CHAT_MESSAGE} from './types';

function checkChatCooldown(character, Game, callback) {
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
            const message = params.join(' ').trim();

            // check if the message is empty
            if (!message.length) {
                return;
            }

            // check for cooldowns
            checkChatCooldown(character, Game, () => {
                Game.socketManager.dispatchToServer({
                    type: CHAT_MESSAGE,
                    payload: {
                        user_id: character.user_id,
                        name: character.name,
                        message: params.join(' '),
                        type: 'global',
                    },
                });
            });
        })
        .catch(() => {});
}

function cmdSay(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const message = params.join(' ').trim();

            // check if the message is empty
            if (!message.length) {
                return;
            }

            // check for cooldowns
            checkChatCooldown(character, Game, () => {
                Game.socketManager.dispatchToRoom(`${character.location.map}_${character.location.y}_${character.location.x}`, {
                    type: CHAT_MESSAGE,
                    payload: {
                        user_id: character.user_id,
                        name: character.name,
                        message: message,
                        type: 'local',
                    },
                });
            });
        })
        .catch(() => {});
}

function cmdWhisper(socket, command, params, Game) {
    if (params.length < 2) {
        return Game.eventToSocket(socket, 'error', 'Invalid whisper. Syntax: /w <username> <message>');
    }

    const target = params.shift();
    // if no name is given, let the user know.
    if (!target) {
        return Game.eventToSocket(socket, 'error', 'Invalid whisper target. Syntax: /w <username> <message> (make sure you do not have additional spaces between /w and <username>');
    }

    const message = params.join(' ').trim();
    // check if the message is empty
    if (!message.length) {
        return;
    }

    Game.characterManager.get(socket.user.user_id)
        .then((sender) => {
            // check for cooldowns
            checkChatCooldown(sender, Game, () => {
                Game.characterManager.getByName(target).then((whisperTarget) => {
                    // send message to the socket
                    Game.socketManager.dispatchToSocket(socket, {
                        type: CHAT_MESSAGE,
                        payload: {
                            type: 'whisper-out',
                            user_id: whisperTarget.user_id,
                            name: whisperTarget.name,
                            message: message,
                        },
                    });
                    // send message to the target user
                    Game.socketManager.dispatchToUser(whisperTarget.user_id, {
                        type: CHAT_MESSAGE,
                        payload: {
                            type: 'whisper-in',
                            user_id: sender.user_id,
                            name: sender.name,
                            message: message,
                        },
                    });
                })
                .catch(() => {
                    Game.eventToSocket(socket, 'error', 'Invalid whisper target.');
                });
            });
        })
        .catch();
}

module.exports = [
    {
        commandKeys: [
            '/global',
            '/g',
            '/yell',
        ],
        method: cmdGlobal,
    },
    {
        commandKeys: [
            '/say',
            '/s',
        ],
        method: cmdSay,
    },
    {
        commandKeys: [
            '/whisper',
            '/w',
            '/tell',
            '/pm',
        ],
        method: cmdWhisper,
    },
];
