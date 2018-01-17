export default class Faction {
    constructor(Game, faction) {
        this.Game = Game;
        // assign all the faction information to the object
        Object.assign(this, faction);
        // tracks whether a faction is in the process of being deleted.
        this.remove = false;
        // holds all members of the faction, who are online
        this.onlineMembers = [];
    }

    linkCharacter(character) {
        // check if the character already is in the faction
        this.onlineMembers.push(character);
        // add the faction to the character.
        character.faction = this;
    }

    addMember(character) {
        return new Promise((resolve, reject) => {
            // check if the character already is in the faction
            if (character.faction_id === this.faction_id) {
                this.linkCharacter(character);
                return resolve(character.user_id);
            }

            this.Game.factionManager.characterAddTo(character.user_id, this.faction_id)
                .then(() => {
                    this.linkCharacter(character);
                    resolve(character.user_id);
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    reject();
                });
        })
        .catch((err) => {
            this.Game.logger.error(err);
            reject();
        });
    }

    removeMember(character) {
        return new Promise((resolve, reject) => {
            // make sure the character is in the faction
            if (character.faction_id !== this.faction_id) {
                return reject();
            }

            this.Game.factionManager.characterRemoveFrom(character.user_id)
                .then(() => {
                    this.onlineMembers = this.onlineMembers.filter((obj) => obj.user_id !== character.user_id);
                    resolve(character.user_id);
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    reject();
                });
        })
        .catch((err) => {
            this.Game.logger.error(err);
            reject();
        });
    }

    makeLeader(character) {
        // make sure the character is in the faction
        if (character.faction_id !== this.faction_id) {
            return false;
        }

        // set the leader to the new user ID
        this.leader_id = character.user_id;
        return true;
    }

    disband() {
        return new Promise((resolve, reject) => {
            this.remove = true;

            this.onlineMembers.forEach((member) => {
                member.faction = null;
                // let the online member know the faction was disbanded
                this.Game.eventToUser(member.user_id, 'warning', `Your faction ${this.name}, was disbanded.`);
                // remove the faction tag from the name, in the online list
                this.Game.characterManager.dispatchUpdatePlayerList(member.user_id);
            });

            resolve();
        });
    }

    toObject() {
        return {
            faction_id: this.faction_id,
            leader_id: this.leader_id,
            name: this.name,
            tag: this.tag,
            members: this.onlineMembers.map((character) => {
                return {
                    user_id: character.user_id,
                    name: character.name
                }
            })
        }
    }
}