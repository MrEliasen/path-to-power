import uuid from 'uuid/v4';
import FactionModel from './model';
import Faction from './object';
import CharacterModel from '../character/model';

export default class FactionManager {
    constructor(Game) {
        this.Game = Game;
        // list of all factions in the game (populated at runtime)
        this.factions = [];
    }

    /**
     * Load all factions
     * @return {Promise}
     */
    load() {
        return new Promise((resolve, reject) => {
            FactionModel.find({}, (err, factions) => {
                if (err) {
                    return reject(this.Game.logger.error(err));
                }

                let loadedFactions = 0;
                // load each of the factions
                factions.forEach((faction) => {
                    this.add(faction.toObject());
                    loadedFactions++;
                });

                resolve(loadedFactions);
            });
        });
    }

    /**
     * Adds the faction_id to the character
     * @param  {String} user_id    User to add the faction to
     * @param  {String} faction_id The faction ID to add
     * @return {Promise}
     */
    characterAddTo(user_id, faction_id) {
        return new Promise((resolve, reject) => {
            CharacterModel.update({_id: user_id }, { $set: { faction_id }}, (err, updated) => {
                if (err) {
                    return reject(err);
                }

                resolve({ user_id, faction_id });
            });
        });
    }

    /**
     * Removes the faction_id from the character
     * @param  {String} user_id     Id of the user we remove from the faction
     * @return {Promise}
     */
    characterRemoveFrom(user_id) {
        return new Promise((resolve, reject) => {
            CharacterModel.update({_id: user_id }, { $set: { faction_id: '' }}, (err, updated) => {
                if (err) {
                    return reject(err);
                }

                resolve({ user_id, faction_id });
            });
        });
    }

    /**
     * Adds a faction to the managed list
     * @param {Object} factionData Plain object with the faction data.
     * @return {Faction Object} The newly created faction object.
     */
    add(factionData) {
        // create the faction object
        const newFaction = new Faction(this.Game, factionData);
        // add it to the managed list
        this.factions.push(newFaction);
        // return the new faction object
        return newFaction;
    }

    /**
     * Get the faction object of the faction, by ID
     * @param  {String} factionId Faction ID
     * @return {Promise}
     */
    get(factionId) {
        return new Promise((resolve, reject) => {
            if (!factionId) {
                return reject();
            }

            const faction = this.factions.find((obj) => obj.faction_id === factionId);

            if (!faction) {
                return reject();
            }

            resolve(faction);
        })
    }

    /**
     * Get a faction object by name
     * @param  {String} factionName The name of the faction
     * @return {Promise}
     */
    getByName(factionName) {
        factionName = factionName.toLowerCase();

        return new Promise((resolve, reject) => {
            if (!factionName) {
                return reject();
            }

            const faction = this.factions.find((obj) => obj.name_lowercase === factionName);

            if (!faction) {
                return reject();
            }

            resolve(faction);
        })
    }

    /**
     * Get the list of all factions
     * @param {Boolean} toClient Wheter to return the list of references of plain objects
     * @return {Array} List of factions
     */
    getList(toClient = false) {
        const factions = this.factions;

        if (!toClient) {
            return factions;
        }

        return factions.map((faction) => {
            return {
                ...faction.toObject()
            }
        })
    }

    save(faction) {
        return new Promise((resolve, reject) => {
            if (!faction._id) {
                return reject('Missing faction DB _id');
            }

            FactionModel.find({ faction_id: faction.faction_id }, (err, dbFaction) => {
                if (err) {
                    return reject(err);
                }

                dbFaction.name = faction.name;
                dbFaction.tag = faction.tag;
                dbFaction.leader_id = faction.leader_id;

                dbFaction.save((err) => {
                    this.Game.logger.debug(`Faction ${faction._id} saved.`);
                    resolve(faction);
                });
            });
        });
    }

    /**
     * Create a new faction
     * @param {String} user_id     User ID of the leader
     * @param {String} factionName Name of the faction
     * @param {String} factionTag  Prefix of the faction
     * @return {Promise}
     */
    create(user_id, factionName, factionTag) {
        user_id = user_id.toString();

        return new Promise((resolve, reject) => {
            this.Game.characterManager.get(user_id).then((character) => {
                FactionModel.find({
                    $or: [
                        {name_lowercase: factionName.toLowerCase()},
                        {tag_lowercase: factionTag.toLowerCase()},
                        {leader_id: user_id}
                    ]
                }, (err, factions) => {
                    if (err) {
                        this.Game.logger.error(err);
                        return reject();
                    }

                    // faction(s) with same name, tag or leader was found
                    if (factions.length) {
                        return reject(factions)
                    }

                    // no duplicates found, create new faction
                    const newFaction = this.add({
                        faction_id: uuid(),
                        name: factionName,
                        tag: factionTag,
                        leader_id: user_id.toString()
                    });

                    if (!newFaction) {
                        this.Game.logger.error(`Error creating faction object`);
                        return reject();
                    }

                    const dbFaction = new FactionModel({
                        ...newFaction.toObject()
                    });

                    dbFaction.save(async (err) => {
                        if (err) {
                            this.Game.logger.error(`Error saving new faction in DB`, err);
                            return this.Game.logger.error(err);
                        }
                        // Add the faction object to the character
                        await newFaction.addMember(character);
                        // let them know it succeeded
                        this.Game.logger.debug(`New faction ${newFaction.faction_id} created.`);
                        // resolve back to caller
                        resolve(newFaction);
                    });
                });
            })
            .catch(() => {})
        });
    }

    /**
     * Permananetly removes a faction
     * @param  {Faction Object} faction The faction to remove
     * @return {Promise}
     */
    delete(factionId) {
        return new Promise((resolve, reject) => {
            // get the faction object
            this.get(factionId)
                .then(async (faction) => {
                    // remove all members
                    await faction.disband();

                    // remove from managed list
                    this.factions = this.factions.filter((obj) => !obj.remove);

                    // remove from databse
                    FactionModel.remove({ faction_id: factionId }, (err, deleted) => {
                        if (err) {
                            this.Game.logger.error(err);
                            reject();
                            return this.Game.logger.error(err);
                        }

                        CharacterModel.update({faction_id: factionId }, { $set: {faction_id: ''}}, { multi: true }, (error, raw) => {
                            if (err) {
                                this.Game.logger.error(err);
                            }

                            resolve(factionId);
                        });
                    });
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    reject(err);
                });
        });
    }
}