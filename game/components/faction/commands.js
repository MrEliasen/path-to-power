import escapeStringRegex from 'escape-string-regexp';
import { CHAT_MESSAGE } from '../command/types';

// TODO: Create a config for the variables
const name = {
    max_length: 25,
    min_length: 3
}
const tag = {
    max_length: 3,
    min_length: 1
}

export function cmdFactionCreate(socket, command, params, Game) {
    // check we got 2 parameters
    if (params.length != 2) {
        return Game.eventToSocket(socket, 'error', 'You must specify both a name and tag eg: /factioncreate MyfactionName Tag');
    }

    const factionName = params[0];
    const factionTag = params[1];

    // check the length of the name and the tag are within the requirements
    if (factionName.length > name.max_length || factionName.length < name.min_length) {
        return Game.eventToSocket(socket, 'error', `The faction name must be ${name.min_length}-${name.max_length} characters in length.`);
    }
    if (factionTag.length > tag.max_length || factionTag.length < tag.min_length) {
        return Game.eventToSocket(socket, 'error', `The faction tag must be ${tag.min_length}-${tag.max_length} characters in length.`);
    }

    // make sure the name only contain alphanumeric characters
    if (factionName !== escapeStringRegex(factionName).replace(/[^a-z0-9]/gi, '')) {
        return Game.eventToSocket(socket, 'error', 'Your faction name and tag can only consist of alphanumeric characters (0-9, a-z).');
    }
    if (factionTag !== escapeStringRegex(factionTag).replace(/[^a-z0-9]/gi, '')) {
        return Game.eventToSocket(socket, 'error', 'Your faction name and tag can only consist of alphanumeric characters (0-9, a-z).');
    }

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
        })
}

export function cmdFactionDisband(socket, command, params, Game) {
    // check we got 1 parameter
    if (params.length != 1) {
        return Game.eventToSocket(socket, 'error', 'To try avoid accidental faction disbands, you must specify your faction name (case sensitive) as the first argument eg: /factiondisband MyfactionName');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // make sure they are in a faction
            if (!character.faction) {
                return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
            }

            // make sure they are the leader
            if (character.faction.leader_id !== character.user_id) {
                return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
            }

            // make sure the faction name is identical
            if (character.faction.name !== params[0]) {
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
        })
        .catch(()=>{
            Game.eventToSocket(socket, 'error', 'Something went wrong, when trying to disband your faction.');
        });
}

export function cmdFactionInvite(socket, command, params, Game) {
    // check we got 1 parameter
    if (params.length != 1) {
        return Game.eventToSocket(socket, 'error', 'You must specify a player name eg: /factioninvite PlayerName');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // make sure they are in a faction
            if (!character.faction) {
                return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
            }

            // make sure they are the leader
            if (character.faction.leader_id !== character.user_id) {
                return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
            }

            // get the target character we are trying to invite
            const targetCharacter = Game.characterManager.getByName(params[0]);

            // if they where not online/didn't exist
            if (!targetCharacter) {
                return Game.eventToSocket(socket, 'error', 'There are no players online by that name');
            }

            // make sure the target is not in a faction already
            if (targetCharacter.faction) {
                return Game.eventToSocket(socket, 'error', 'That player is already in a faction. They must leave they current faction before they can join a new.');
            }

            // Create the invite
            character.faction.inviteMember(targetCharacter);

            // let the leader know the invite succeeded.
            Game.eventToSocket(socket, 'success', `${targetCharacter.name} has been invited to your faction!`);
            // send a welcome notification to the new member
            Game.eventToUser(targetCharacter.user_id, 'info', `You have been invited to join the faction ${character.faction.name}. To join type: /factionjoin ${character.faction.name}`);
        })
        .catch(()=>{
            Game.eventToSocket(socket, 'error', 'Something went wrong.');
        });
}

export function cmdFactionAcceptInvite(socket, command, params, Game) {
    // check we got 1 parameter
    if (params.length != 1) {
        return Game.eventToSocket(socket, 'error', 'You must specify the faction you want to join eg: /factionjoin FactionName');
    }

    // Get the character whom sent the join request
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get the faction they want to join
            Game.factionManager.getByName(params[0])
                .then((faction) => {
                    // make sure there is an outstanding invite for the character
                    if (!faction.isInvited(character)) {
                        return Game.eventToSocket(socket, 'error', 'There is no invite pending from that faction.')
                    }

                    faction.addMember(character).
                        then(() => {
                            // let the faction know, a new memeber joined
                            Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                                type: CHAT_MESSAGE,
                                payload: {
                                    name: null,
                                    message: `${character.name} has joined ${character.faction.name}!`,
                                    type: 'faction'
                                }
                            });
                            // update their presence on the online player list
                            Game.characterManager.dispatchUpdatePlayerList(character.user_id);
                        })
                        .catch(() => {

                        })
                })
                .catch(()=>{
                    Game.eventToSocket(socket, 'error', 'No invite for that faction was found. Make sure you spelled the faction name correct.');
                });
        })
        .catch((err) => {
            Game.logger.info(err);
        });
}

export function cmdFactionSay(socket, command, params, Game) {
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // make sure they are in a faction
            if (!character.faction) {
                return Game.eventToSocket(socket, 'error', 'You are not a member of a faction.');
            }

            Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                type: CHAT_MESSAGE,
                payload: {
                    name: character.name,
                    message: params.join(' '),
                    type: 'faction'
                }
            });
        })
        .catch(Game.logger.error)
}

export function cmdFactionKick(socket, command, params, Game) {
    // check we got 1 parameter
    if (params.length != 1) {
        return Game.eventToSocket(socket, 'error', 'You must specify a player name eg: /factionkick PlayerName');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // make sure they are in a faction
            if (!character.faction) {
                return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
            }

            // make sure they are the leader
            if (character.faction.leader_id !== character.user_id) {
                return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
            }

            const targetCharacter = Game.characterManager.getByName(params[0]);

            // if they are online, run them through the faction.removeMember()
            if (targetCharacter) {
                return character.faction.removeMember(targetCharacter)
                            .then(() => {
                                // let the faction know, a member was removed
                                Game.socketManager.dispatchToRoom(character.faction.faction_id, {
                                    type: CHAT_MESSAGE,
                                    payload: {
                                        name: null,
                                        message: `${targetCharacter.name} was removed from ${character.faction.name}!`,
                                        type: 'faction'
                                    }
                                });
                                // let the member know they where removed from the faction
                                Game.socketManager.dispatchToUser(targetCharacter.user_id, {
                                    type: CHAT_MESSAGE,
                                    payload: {
                                        name: null,
                                        message: `You have been kicked/removed from ${character.faction.name}!`,
                                        type: 'faction'
                                    }
                                });

                                // update their presence on the online player list
                                Game.characterManager.dispatchUpdatePlayerList(targetCharacter.user_id);
                            })
                            .catch(() => {
                                Game.eventToSocket(socket, 'error', 'Something went wrong.');
                            });
            }

            // if they are not online, remove character from faction in the database only
            Game.characterManager.dbGetByName(params[0])
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
                                    type: 'faction'
                                }
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
                })
        })
        .catch(()=>{
            Game.eventToSocket(socket, 'error', 'Something went wrong.');
        });
}



export function cmdFactionMakeLeader(socket, command, params, Game) {
    // check we got 1 parameter
    if (params.length != 1) {
        return Game.eventToSocket(socket, 'error', 'You must specify the name of the faction member you want to promote to leader eg: /factionpromote MemberName');
    }

    // Get the character whom sent the join request
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // make sure they are in a faction
            if (!character.faction) {
                return Game.eventToSocket(socket, 'error', 'You are not in a faction.');
            }

            // make sure they are the leader
            if (character.faction.leader_id !== character.user_id) {
                return Game.eventToSocket(socket, 'error', 'You are not the leader of your faction.');
            }

            // get the target character we are trying to invite
            const targetCharacter = Game.characterManager.getByName(params[0]);

            // if they where not online/didn't exist
            if (!targetCharacter) {
                return Game.eventToSocket(socket, 'error', 'There are no players online by that name');
            }

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
                            type: 'faction'
                        }
                    });
                })
                .catch((err) => {
                    Game.eventToSocket(socket, 'error', err);
                })
        })
        .catch((err) => {
            Game.logger.info(err);
        });
}