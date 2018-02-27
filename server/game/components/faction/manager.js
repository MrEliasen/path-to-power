import Promise from 'bluebird';
import uuid from 'uuid/v4';
import FactionModel from './model';
import Faction from './object';
import CharacterModel from '../character/model';
import factionCommands from './commands';
import {findObjectInArray} from '../../helper';

/**
 * Faction manager
 */
export default class FactionManager {
    /**
     * Class constructor
     * @param  {Game} Game Main Game object
     */
    constructor(Game) {
        this.Game = Game;
        // list of all factions in the game (populated at runtime)
        this.factions = [];
    }

    /**
     * Load all factions, and register commands
     * @return {Promise}
     */
    async init() {
        // register all the
        this.Game.commandManager.registerManager(factionCommands);

        // load our factions
        const factions = await FactionModel.findAsync({});

        if (!factions) {
            return;
        }

        // load each of the factions
        factions.forEach((faction) => {
            this.add(faction.toObject());
        });

        console.log('FACTION MANAGER LOADED');
    }

    /**
     * Adds the faction_id to the character
     * @param  {String} user_id    User to add the faction to
     * @param  {String} faction_id The faction ID to add
     * @return {Promise}
     */
    characterAddTo(user_id, faction_id) {
        return CharacterModel.update({_id: user_id}, {$set: {faction_id}});
    }

    /**
     * Removes the faction_id from the character
     * @param  {String} user_id     Id of the user we remove from the faction
     * @return {Promise}
     */
    dbCharacterRemove(user_id) {
        return CharacterModel.update({_id: user_id}, {$set: {faction_id: ''}});
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
        if (!factionId) {
            return null;
        }

        const faction = this.factions.find((obj) => obj.faction_id === factionId);

        if (!faction) {
            return null;
        }

        return faction;
    }

    /**
     * Get a faction object by name
     * @param  {String} factionName The name of the faction
     * @return {Promise}
     */
    getByName(factionName) {
        if (!factionName) {
            return null;
        }

        // first check if there is a direct match between the name and a player
        let faction = findObjectInArray(this.factions, 'name_lowercase', factionName.toLowerCase());

        if (!faction) {
            return null;
        }

        return faction;
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
                ...faction.toObject(),
            };
        });
    }

    /**
     * Saves a factions sate to the database
     * @param  {Faction} faction The faction object to save
     * @return {Promise}
     */
    async save(faction) {
        const dbFaction = await FactionModel.findOneAsync({faction_id: faction.faction_id});

        if (!dbFaction) {
            throw new Error('Faction was not saved, as it was not found in the databse');
        }

        dbFaction.name = faction.name;
        dbFaction.tag = faction.tag;
        dbFaction.leader_id = faction.leader_id;

        return dbFaction.saveAsync();
    }

    /**
     * Create a new faction
     * @param {String} user_id     User ID of the leader
     * @param {String} factionName Name of the faction
     * @param {String} factionTag  Prefix of the faction
     * @return {Promise}
     */
    async create(user_id, factionName, factionTag) {
        user_id = user_id.toString();

        const character = this.Game.characterManager.get(user_id);
        const factions = FactionModel.findAsync({
            $or: [
                {name_lowercase: factionName.toLowerCase()},
                {tag_lowercase: factionTag.toLowerCase()},
                {leader_id: user_id},
            ],
        });

        if (factions && factions.length) {
            return factions;
        }

        // no duplicates found, create new faction
        const newFaction = this.add({
            faction_id: uuid(),
            name: factionName,
            tag: factionTag,
            leader_id: user_id.toString(),
        });

        if (!newFaction) {
            throw new Error('Error creating faction object');
        }

        const dbFaction = new FactionModel({
            ...newFaction.toObject(),
        });

        await dbFaction.save();

        // Add the faction object to the character
        await newFaction.addMember(character);

        // resolve back to caller
        return newFaction;
    }

    /**
     * Permananetly removes a faction
     * @param  {Faction Object} faction The faction to remove
     * @return {Promise}
     */
    async delete(factionId) {
        // get the faction object
        const faction = this.get(factionId);

        // remove all members
        faction.disband();

        // remove from managed list
        this.factions = this.factions.filter((obj) => !obj.remove);

        // remove from databse
        await FactionModel.remove({faction_id: factionId});
        await CharacterModel.update({faction_id: factionId}, {$set: {faction_id: ''}}, {multi: true});

        return factionId;
    }
}
