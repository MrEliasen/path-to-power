import escapeStringRegex from 'escape-string-regexp';

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
            // TODO: Update player name on character list with the new faction name.
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