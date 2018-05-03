import {COMMAND_CHAT_MESSAGE, CHARACTER_LEFT_GRID} from 'shared/actionTypes';

/**
 * Check if there is an active cooldown or not, for chatting
 * @param  {Character} character The character object to check cooldowns for
 * @param  {Game}      Game      The main Game object
 * @param  {Function}  callback  Callback function
 */
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

/**
 * Global command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game} Game                  The main Game object
 */
function cmdGlobal(socket, character, command, params, cmdObject, Game) {
    const message = params.join(' ').trim();

    // check if the message is empty
    if (!message.length) {
        return Game.eventToSocket(socket, 'error', 'You must specify a message to send. Syntax: /g <message>');
    }

    // check for cooldowns
    checkChatCooldown(character, Game, () => {
        Game.socketManager.dispatchToRoom('game', {
            type: COMMAND_CHAT_MESSAGE,
            payload: {
                user_id: character.user_id,
                name: character.name,
                message: params.join(' '),
                type: 'global',
            },
        });
    });
}

/**
 * Say command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game} Game                  The main Game object
 */
function cmdSay(socket, character, command, params, cmdObject, Game) {
    const message = params.join(' ').trim();

    // check if the message is empty
    if (!message.length) {
        return Game.eventToSocket(socket, 'error', 'You must specify a message to send. Syntax: /s <message>');
    }

    // check for cooldowns
    checkChatCooldown(character, Game, () => {
        Game.socketManager.dispatchToRoom(`${character.location.map}_${character.location.y}_${character.location.x}`, {
            type: COMMAND_CHAT_MESSAGE,
            payload: {
                user_id: character.user_id,
                name: character.name,
                message: message,
                type: 'local',
            },
        });
    });
}

/**
 * Whisper command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game} Game                  The main Game object
 */
function cmdWhisper(socket, character, command, params, cmdObject, Game) {
    // check for cooldowns
    checkChatCooldown(character, Game, () => {
        const whisperTarget = params[0];
        let message = params[1];

        // send message to the socket
        Game.socketManager.dispatchToSocket(socket, {
            type: COMMAND_CHAT_MESSAGE,
            payload: {
                type: 'whisper-out',
                user_id: whisperTarget.user_id,
                name: whisperTarget.name,
                message: message,
            },
        });

        if (character.user_id === whisperTarget.user_id) {
            message = message.split('').reverse().join('');
        }

        // send message to the target user
        Game.socketManager.dispatchToUser(whisperTarget.user_id, {
            type: COMMAND_CHAT_MESSAGE,
            payload: {
                type: 'whisper-in',
                user_id: character.user_id,
                name: character.name,
                message: message,
            },
        });
    });
}

/**
 * Help command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game} Game                  The main Game object
 */
function cmdHelp(socket, character, command, params, cmdObject, Game) {
    const cmdNotFound = [
        'The command you where looking for was not found.',
        'To see a list of commands available to you, type /commands',
    ];
    let message = [
        'IN-GAME HELP OPTIONS',
        '--------------------',
        'If you need help learning how to play the name, see the "How to play" link in the top-right navigation.',
        'To see a list of commands available to you, type /commands',
        'If you would like information on a particular item, npc, map etc. type /info',
        'If you need information about a specific command, type /help <command>. Eg: /help /info',
    ];

    // if the player provided a parameter we will search through everything to see if we have a match
    if (params[0]) {
        message = Game.commandManager.getInfo(params[0]) || cmdNotFound;
    }

    Game.eventToUser(
        character.user_id,
        'multiline',
        message,
    );
}

/**
 * Info command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game} Game                  The main Game object
 */
function cmdInfo(socket, character, command, params, cmdObject, Game) {
    let message;

    switch (params[0].toLowerCase()) {
        case 'item':
            message = Game.itemManager.getInfo(params[1]) || [];
            break;

        case 'npc':
            message = Game.npcManager.getInfo(params[1]) || [];
            break;

        case 'command':
            message = Game.commandManager.getInfo(params[1]) || [];
            break;

        case 'map':
            message = Game.mapManager.getInfo(params[1]) || [];
            break;

        default:
            message = [
                'Invalid Object type',
            ];
            break;
    }

    Game.eventToUser(
        character.user_id,
        'multiline',
        message,
    );
}

/**
 * Teleport command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdTeleport(socket, character, command, params, cmdObject, Game) {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    let y = params[0];
    let x = params[1];
    let gameMap = params[2].id || character.location.map;

    // remove aim from current target, if set
    character.releaseTarget();

    // leave the old grid room
    socket.leave(character.getLocationId());

    // dispatch leave message to grid
    Game.eventToRoom(character.getLocationId(), 'info', `You see ${character.name} vanish into thin air.`);

    // remove player from the grid list of players
    Game.socketManager.dispatchToRoom(character.getLocationId(), {
        type: CHARACTER_LEFT_GRID,
        payload: character.user_id,
    });

    // update character location
    character.updateLocation(gameMap, x, y);

    // dispatch join message to new grid
    Game.eventToRoom(character.getLocationId(), 'info', `${character.name} emerge from thin air`, [character.user_id]);

    // add player from the grid list of players
    Game.socketManager.dispatchToRoom(
        character.getLocationId(),
        Game.characterManager.joinedGrid(character)
    );

    // update the socket room
    socket.join(character.getLocationId());

    // update client/socket character and location information
    Game.characterManager.updateClient(character.user_id);

    // send the new grid details to the client
    Game.mapManager.updateClient(character.user_id);
}

module.exports = [
    {
        command: '/teleport',
        aliases: [
            '/tp',
        ],
        params: [
            {
                name: 'North Coordinate',
                desc: 'The N coordinate to go to.',
                rules: 'required|integer',
            },
            {
                name: 'East Coordinate',
                desc: 'The E coordinate to go to.',
                rules: 'required|integer',
            },
            {
                name: 'Map Name',
                desc: 'The name of the map to go to.',
                rules: 'gamemap',
            },
        ],
        description: 'Teleport to a specific location.',
        method: cmdTeleport,
    },
    {
        command: '/global',
        aliases: [
            '/g',
            '/yell',
        ],
        params: [
            {
                name: 'Message',
                desc: 'The message you wish to send to the player.',
                rules: 'required|maxlen:500',
            },
        ],
        description: 'Speak in global chat.',
        method: cmdGlobal,
    },
    {
        command: '/say',
        aliases: [
            '/s',
        ],
        params: [
            {
                name: 'Message',
                desc: 'The message you wish to send to the player.',
                rules: 'required|maxlen:500',
            },
        ],
        description: 'Speak in local chat. Only people in same spot can see it.',
        method: cmdSay,
    },
    {
        command: '/help',
        aliases: [],
        params: [
            {
                name: 'Question',
                desc: 'The thing you would like more information about. Eg. an item name, NPC type or command.',
                rules: 'minlen:1',
            },
        ],
        description: 'To get help with anything in the game, try this command.',
        method: cmdHelp,
    },
    {
        command: '/info',
        aliases: [],
        params: [
            {
                name: 'Object',
                desc: 'The type of object you are searching for, eg: item',
                rules: 'required',
            },
            {
                name: 'Name or ID',
                desc: 'The thing you would like more information about. Eg. an item name, NPC type or command.',
                rules: 'required',
            },
        ],
        description: 'Get information about specific objects.',
        method: cmdInfo,
    },
    {
        command: '/whisper',
        aliases: [
            '/w',
            '/tell',
            '/pm',
        ],
        params: [
            {
                name: 'Target',
                desc: 'The name of the player you want to send a private message to',
                rules: 'required|player',
            },
            {
                name: 'Message',
                desc: 'The message you wish to send to the player.',
                rules: 'required|maxlen:500',
            },
        ],
        description: 'Send a private message to another player.',
        method: cmdWhisper,
    },
];
