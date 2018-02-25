import Promise from 'bluebird';

/**
 * Faction object class
 */
export default class Faction {
    /**
     * Class constructor
     * @param  {Game} Game    Main Game object
     * @param  {Object} faction Plain faction object from the database
     */
    constructor(Game, faction) {
        this.Game = Game;
        // assign all the faction information to the object
        Object.assign(this, faction);
        // tracks whether a faction is in the process of being deleted.
        this.remove = false;
        // holds all members of the faction, who are online
        this.onlineMembers = [];
        // keeps tracks of all active faction invtes. The list will contain the user_id's
        // of anyone whos been invited.
        this.invites = [];
    }

    /**
     * Check if there is an outstanding invite for the character
     * @param  {Character Obj}  character The character to check
     * @return {Boolean}
     */
    isInvited(character) {
        if (this.invites.findIndex((user_id) => user_id === character.user_id) === -1) {
            return false;
        }

        return true;
    }

    /**
     * Sends an invite to the Character
     * @param  {Character Obj} character The character to invite
     */
    inviteMember(character) {
        if (this.invites.findIndex((user_id) => user_id === character.user_id) === -1) {
            this.invites.push(character.user_id);
        }
    }

    /**
     * Adds the Character to the faction online list and bind the factio obj to the character
     * @param  {Character Obj} character The Character to "link"
     */
    linkCharacter(character) {
        // add the faction to the character.
        character.faction = this;

        if (!this.onlineMembers.find((obj) => obj.user_id === character.user_id)) {
            // check if the character already is in the faction
            this.onlineMembers.push(character);
        }

        // join the faction-only room
        const socket = this.Game.socketManager.get(character.user_id);
        socket.join(this.faction_id);
    }

    /**
     * Removes a character from list of online members, and removes faction reference (does not kick from the faction!)
     * @param  {Character} character The character to unlink
     */
    unlinkCharacter(character) {
        character.faction = null;
        const index = this.onlineMembers.findIndex((obj) => obj.user_id === character.user_id);

        if (index !== -1) {
            this.onlineMembers.splice(index, 1);
        }
    }

    /**
     * Adds a character to the faction
     * @param {Character Obj} character Character to add to the faction
     */
    async addMember(character) {
        // remove outstanding invites if found
        if (this.invites.findIndex((user_id) => user_id === character.user_id) !== -1) {
            this.invites.splice(this.invites.findIndex((user_id) => user_id === character.user_id), 1);
        }

        // check if the character already is in the faction
        if (character.faction_id === this.faction_id) {
            //this.linkCharacter(character);
            return character.user_id;
        }

        const result = await this.Game.factionManager.characterAddTo(character.user_id, this.faction_id);

        if (!result) {
            return null;
        }

        this.linkCharacter(character);
        return character.user_id;
    }

    /**
     * Removes a character from the fraction
     * @param  {Character Obj} character The character to remove from the faction
     * @return {Promise}
     */
    async removeMember(character) {
        // make sure the character is in the faction
        if (character.faction_id !== this.faction_id) {
            return 'Character is not in the same faction';
        }

        // remove the faction reference from the character
        character.faction = null;
        character.faction_id = '';

        await this.Game.factionManager.dbCharacterRemove(character.user_id);

        // remove member from faction online list
        this.onlineMembers = this.onlineMembers.filter((obj) => obj.user_id !== character.user_id);

        // remove the character from the faction-only room
        const socket = await this.Game.socketManager.get(character.user_id);

        socket.leave(this.faction_id);
        resolve(character.user_id);
    }

    /**
     * Changes the faction leader to the specified character
     * @param  {Character Obj} character The character who should be the new leader
     * @return {Boolan} whether the leader change was successful
     */
    makeLeader(character) {
        // make sure the character is in the faction
        if (character.faction_id !== this.faction_id) {
            return reject('The player is not in the same faction.');
        }

        // make sure the character is in the faction
        if (character.user_id === this.leader_id) {
            return reject('You are already the leader of this faction.');
        }

        // set the leader to the new user ID
        this.leader_id = character.user_id;
        // save the changes to the faction
        return this.Game.factionManager.save(this);
    }

    /**
     * Disbands a faction, removing all members from the list
     * @return {Promise}
     */
    disband() {
        this.remove = true;

        this.onlineMembers.forEach((member) => {
            member.faction = null;
            // let the online member know the faction was disbanded
            this.Game.eventToUser(member.user_id, 'warning', `Your faction ${this.name}, was disbanded.`);
            // remove the faction tag from the name, in the online list
            this.Game.characterManager.dispatchUpdatePlayerList(member.user_id);
        });
    }

    /**
     * Exports the faction to a plain object
     * @param  {Bool}   ignoreMembers Whether to include members in the exported data or not.
     * @return {Object}
     */
    toObject(ignoreMembers = false) {
        return {
            faction_id: this.faction_id,
            leader_id: this.leader_id,
            name: this.name,
            tag: this.tag,
            members: !ignoreMembers ? this.onlineMembers.map((character) => {
                return {
                    user_id: character.user_id,
                    name: character.name,
                };
            }) : null,
        };
    }
}
