import {CHAT_MESSAGE} from '../command/types';

/**
 * Faction create command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionCreate(socket, character, command, params, cmdObject, Game) {
    const factionName = params[0];
    const factionTag = params[1];

    Game.factionManager.create(socket.user.user_id, factionName, factionTag)
        .then((newFaction) => {
            Game.eventToSocket(socket, 'success', 'Your new faction has been created!');
            // update the clients with the new player name
            Game.characterManager.dispatchUpdatePlayerList(socket.user.user_id);
        })
        .catch((factions) => {
            // we had an error
            if (!factions) {
                return Game.eventToSocket(socket, 'error', 'Something went wrong when trying to create your faction.');
            }

            // check if they are already a leader of a faction
            if (factions.filter((obj) => obj.leader_id === socket.user.user_id).length) {
                return Game.eventToSocket(socket, 'error', 'You cannot be a leader of more than 1 faction at the same time.');
            }

            // check if the faction name is taken
            if (factions.filter((obj) => obj.name_lowercase === factionName.toLowerCase()).length) {
                return Game.eventToSocket(socket, 'error', 'The faction name is already taken.');
            }

            // check if the faction tag is taken
            if (factions.filter((obj) => obj.tag_lowercase === factionTag.toLowerCase()).length) {
                return Game.eventToSocket(socket, 'error', 'The faction tag is already taken.');
            }
        });
}

/**
 * Faction disband command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionDisband(socket, character, command, params, cmdObject, Game) {
    // make sure they are in a faction
    if (!character.faction) {
        return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
    }

    // make sure they are the leader
    if (character.faction.leader_id !== character.user_id) {
        return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
    }

    // make sure the faction name is identical
    if (character.faction.name !== params[0].name) {
        return Game.eventToSocket(socket, 'error', 'The faction name you typed does not match the faction you are in (case sensitive).');
    }

    // remove all members from the faction and delete it
    Game.factionManager.delete(character.faction.faction_id)
        .then(() => {
            Game.eventToSocket(socket, 'success', 'Your faction was disbanded.');
        })
        .catch(() => {
            Game.eventToSocket(socket, 'error', 'Something went wrong, when trying to disband your faction.');
        });
}

/**
 * Faction invite command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionInvite(socket, character, command, params, cmdObject, Game) {
    // make sure they are in a faction
    if (!character.faction) {
        return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
    }

    // make sure they are the leader
    if (character.faction.leader_id !== character.user_id) {
        return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
    }

    const targetCharacter = params[0];

    // make sure the target is not in a faction already
    if (targetCharacter.faction) {
        return Game.eventToSocket(socket, 'error', 'That player is already in a faction. They must leave they current faction before they can join a new.');
    }

    // check if the character has an existing cooldown for this action, if they are trying to hide
    const ticksLeft = Game.cooldownManager.ticksLeft(character, 'action_faction_invite');

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You must wait another ${(ticksLeft / 10)} seconds before you can send another invite.`);
    }

    // add the search cooldown to the character
    Game.cooldownManager.add(character, 'faction_invite', null, true);

    // Create the invite
    character.faction.inviteMember(targetCharacter);

    // let the leader know the invite succeeded.
    Game.eventToSocket(socket, 'success', `${targetCharacter.name} has been invited to your faction!`);
    // send a welcome notification to the new member
    Game.eventToUser(targetCharacter.user_id, 'info', `You have been invited to join the faction ${character.faction.name}. To join type: /factionjoin ${character.faction.name}`);
}

/**
 * Faction join command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionAcceptInvite(socket, character, command, params, cmdObject, Game) {
    const faction = params[0];

    // make sure there is an outstanding invite for the character
    if (!faction.isInvited(character)) {
        return Game.eventToSocket(socket, 'error', 'There is no invite pending from that faction.');
    }

    faction.addMember(character).
        then(() => {
            // let the faction know, a new memeber joined
            Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                type: CHAT_MESSAGE,
                payload: {
                    name: null,
                    message: `${character.name} has joined ${character.faction.name}!`,
                    type: 'faction',
                },
            });
            // update their presence on the online player list
            Game.characterManager.dispatchUpdatePlayerList(character.user_id);
        })
        .catch(() => {

        });
}

/**
 * Faction chat command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionSay(socket, character, command, params, cmdObject, Game) {
    // make sure they are in a faction
    if (!character.faction) {
        return Game.eventToSocket(socket, 'error', 'You are not a member of a faction.');
    }

    // check if the character has an existing cooldown for this action, if they are trying to hide
    const ticksLeft = Game.cooldownManager.ticksLeft(character, 'action_chat');

    if (ticksLeft) {
        return Game.eventToUser(character.user_id, 'error', `You must wait another ${(ticksLeft / 10)} seconds before you can send another message.`);
    }

    // add the search cooldown to the character
    Game.cooldownManager.add(character, 'chat', null, true);

    Game.socketManager.dispatchToRoom(character.faction.faction_id, {
        type: CHAT_MESSAGE,
        payload: {
            user_id: character.user_id,
            name: character.name,
            message: message,
            type: 'faction',
        },
    });
}

/**
 * Faction kick command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionKick(socket, character, command, params, cmdObject, Game) {
    // make sure they are in a faction
    if (!character.faction) {
        return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
    }

    // make sure they are the leader
    if (character.faction.leader_id !== character.user_id) {
        return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
    }

    const targetCharacter = params[0];

    // if they are online, run them through the faction.removeMember()
    character.faction.removeMember(targetCharacter)
        .then(() => {
            // let the member know they where removed from the faction
            Game.socketManager.dispatchToUser(targetCharacter.user_id, {
                type: CHAT_MESSAGE,
                payload: {
                    name: null,
                    message: `You have been kicked/removed from ${character.faction.name}!`,
                    type: 'faction',
                },
            });

            // update their presence on the online player list
            Game.characterManager.dispatchUpdatePlayerList(targetCharacter.user_id);
        })
        .catch(() => {
            Game.eventToSocket(socket, 'error', 'Something went wrong.');
        });

    // if they are not online, remove character from faction in the database only
    Game.characterManager.dbGetByName(targetCharacter.name)
        .then((dbCharacter) => {
            // make sure the character is in the same faction
            if (dbCharacter.faction_id !== character.faction.faction_id) {
                return Game.eventToSocket(socket, 'error', 'This player is not part of your faction.');
            }
            // remove them from the faction
            Game.factionManager.dbCharacterRemove(dbCharacter.user_id)
                .then(() => {
                    // let the faction know, a member was removed
                    Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                        type: CHAT_MESSAGE,
                        payload: {
                            name: null,
                            message: `${dbCharacter.name} was removed from ${character.faction.name}!`,
                            type: 'faction',
                        },
                    });
                })
                .catch(() => {
                    Game.eventToSocket(socket, 'error', 'Something went wrong.');
                });
        })
        .catch((err) => {
            if (err) {
                return Game.eventToSocket(socket, 'error', err);
            }

            Game.eventToSocket(socket, 'error', 'No player found by that name.');
        });
}

/**
 * Faction promote command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdFactionMakeLeader(socket, character, command, params, cmdObject, Game) {
    // make sure they are in a faction
    if (!character.faction) {
        return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
    }

    // make sure they are the leader
    if (character.faction.leader_id !== character.user_id) {
        return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
    }

    const targetCharacter = params[0];

    // make sure the target is not in a faction already
    if (!targetCharacter.faction || targetCharacter.faction.faction_id !== character.faction.faction_id) {
        return Game.eventToSocket(socket, 'error', 'That player is not a member of your faction. They must be a member of your faction in order for you to promote them.');
    }

    // promote the new player
    character.faction.makeLeader(targetCharacter)
        .then(() => {
            // let the faction know a new leader was assigned
            Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                type: CHAT_MESSAGE,
                payload: {
                    name: null,
                    message: `${targetCharacter.name} has been promoted to the new leader of ${character.faction.name}!`,
                    type: 'faction',
                },
            });
        })
        .catch((err) => {
            Game.eventToSocket(socket, 'error', err);
        });
}

module.exports = [
    {
        command: '/factioncreate',
        aliases: [],
        params: [
            {
                name: 'Faction Name',
                desc: 'The name of the faction you wish to create (case sensitive)',
                rules: 'required|alphanum|minlen:2|maxlen:25',
            },
            {
                name: 'Faction Tag',
                desc: 'The faction\'s TAG',
                rules: 'required|alphanum|minlen:1|maxlen:5',
            },
        ],
        description: 'Create a new faction. Name and Tag is case sensitive.',
        method: cmdFactionCreate,
    },
    {
        command: '/factiondisband',
        aliases: [],
        params: [
            {
                name: 'Faction Name',
                desc: 'The name of your faction to disband',
                rules: 'required|faction',
            },
        ],
        description: 'Disband your faction permanently and immediately.',
        method: cmdFactionDisband,
    },
    {
        command: '/factioninvite',
        aliases: [],
        params: [
            {
                name: 'Player',
                desc: 'The name of the player you want to give cash to',
                rules: 'required|player',
            },
        ],
        description: 'Send an invite to another player, to join your faction.',
        method: cmdFactionInvite,
    },
    {
        command: '/factionjoin',
        aliases: [],
        params: [
            {
                name: 'Faction Name',
                desc: 'The name of the faction, whose invite you wish to accept.',
                rules: 'required|faction',
            },
        ],
        description: 'If you where invited to join a faction.',
        method: cmdFactionAcceptInvite,
    },
    {
        command: '/faction',
        aliases: [
            '/f',
        ],
        params: [
            {
                name: 'Message',
                desc: 'The message you wish to send',
                rules: 'required|maxlen:500',
            },
        ],
        description: 'Speak in the faction-only chat. Will only be visible to members of the same faction.',
        method: cmdFactionSay,
    },
    {
        command: '/factionkick',
        aliases: [],
        params: [
            {
                name: 'Player',
                desc: 'The name of the player you want to give cash to',
                rules: 'required|player',
            },
        ],
        description: 'Kick a member from your faction.',
        method: cmdFactionKick,
    },
    {
        command: '/factionpromote',
        aliases: [],
        params: [
            {
                name: 'Player',
                desc: 'The name of the player you want to give cash to',
                rules: 'required|player',
            },
        ],
        description: 'Promote a member in your faction, to faction leader.',
        method: cmdFactionMakeLeader,
    },
];
