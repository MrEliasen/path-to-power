import Promise from 'bluebird';
import {GAME_COMMAND} from './types';
import commandCommands from './commands';
import {deepCopyObject} from '../../helper';

export default class CommandManager {
    constructor(Game) {
        this.Game = Game;

        // log manager progress
        this.Game.logger.debug('CommandManager::constructor Loaded');

        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));

        // list of managed actions
        this.commands = {};
    }

    /**
     * Load all commands
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, rejecte) => {
            // load map commands
            this.registerManager(commandCommands);
            resolve();
        });
    }

    registerManager(commandsList) {
        commandsList.forEach((obj) => {
            // register the main command
            this.register(obj.command, obj);

            // and register every alias as well
            if (obj.aliases) {
                obj.aliases.forEach((alias) => {
                    this.register(alias, {...obj}, true);
                });
            }
        });
    }

    register(commandName, commandObject, isAlias = false) {
        // in case the commandName didn't have a / in the beginning, add it.
        if (commandName[0] !== '/') {
            commandName = `/${commandName}`;
        }

        // check if a command is already registered to that key
        if (this.commands[commandName]) {
            return this.Game.logger.warning(`The command ${commandName}, is already registered to the method: ${this.commands[commandName].name}. Registration ignored.`);
        }

        // This is needed for when we fetch the list of commands for the client.
        // We do not want to include the aliases directly, but instead referencd in the main command object.
        commandObject.isAlias = isAlias;

        // register the command and the method it should execute
        this.commands[commandName] = commandObject;
    }

    /**
     * checks for dispatches, and reacts only if the type is listend to
     * @param  {Socket.IO Socket} socket Client who dispatched the action
     * @param  {Object} action The redux action
     */
    onDispatch(socket, action) {
        if (action.type !== GAME_COMMAND) {
            return;
        }

        if (!action.payload) {
            return;
        }

        const payload = action.payload.toString().trim().split(' ');

        if (!payload[0]) {
            return;
        }

        const command = payload.shift().toLowerCase();
        const params = payload;

        if (!this.commands[command]) {
            return this.Game.eventToSocket(socket, 'error', `Command ${command} is not a valid command.`);
        }

        this.Game.logger.info('CommandManager::exec', {command, params});
        this.commands[command].method(
            socket,
            command,
            params,
            {
                modifiers: this.commands[command].modifiers ? deepCopyObject(this.commands[command].modifiers) : null,
                description: this.commands[command].description,
            },
            this.Game
        );
    }

    /**
     * returns a list of all available commands in game
     * @return {Object}
     */
    getList() {
        const listOfCommands = {};

        Object.keys(this.commands).forEach((command) => {
            if (!this.commands[command].isAlias) {
                const data = {
                    description: this.commands[command].description || '',
                    aliases: this.commands[command].aliases || [],
                };

                listOfCommands[command] = data;
            }
        });

        return listOfCommands;
    }

    /**
     * Find a specific target at the given location, by name
     * @param  {String} findName      The name, or part of, to search for
     * @param  {Bool}   ignoreHiding  Whether to include hidden players or not
     * @param  {Bool}   ignoreNPCs    Whether to include NPCs or not
     * @param  {Object} location      A character/npc location object
     * @return {Promise}
     */
    findAtLocation(findName, location, ignoreHiding = true, ignoreNPCs = false) {
        return new Promise((resolve, reject) => {
            // get he list of players and NPCS at the grid
            const playersAtGrid = this.Game.characterManager.getLocationList(location.map, location.x, location.y);
            const NPCsAtGrid = this.Game.npcManager.getLocationList(location.map, location.x, location.y);

            // Find target matching the name
            const characters = playersAtGrid.filter((user) => {
                return user.name_lowercase.indexOf(findName) === 0 && (ignoreHiding ? true : !user.hidden);
            });
            const NPCs = ignoreNPCs ? [] : NPCsAtGrid.filter((npc) => {
                return `${npc.name} the ${npc.type}`.toLowerCase().indexOf(findName) === 0;
            });

            // Check if there where any matches
            if (!characters.length && !NPCs.length) {
                return reject('There are nobody around with that name.');
            }

            // get the full list of potential targets
            let matchingTargets = characters.concat(NPCs);
            let target;

            // If there are more than 1 match, see if there is anyone matching the name exactly
            if (matchingTargets.length > 1) {
                target = matchingTargets.find((user) => {
                    // must be a player
                    if (!user.type) {
                        return user.name_lowercase === findName;
                    } else {
                        return `${npc.name} the ${npc.type}`.toLowerCase() === findName;
                    }
                });

                // if there are noone matching the name exactly, tell them to spell out the full name
                if (!target) {
                    return reject('You must be more specific with who you want to target.');
                }
            } else {
                // otherwise select the first and only one in the list
                target = matchingTargets[0];
            }

            resolve(target);
        });
    }
}