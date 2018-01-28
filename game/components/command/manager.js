import Promise from 'bluebird';
import { GAME_COMMAND } from './types';
import * as commandList from '../../data/commands.json';
import commandCommands from './commands';

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
            // and register every command key to the method
            obj.commandKeys.forEach((cmdKey) => {
                this.register(cmdKey, obj.method);
            });
        });
    }

    register(commandName, commandMethod) {
        // in case the commandName didn't have a / in the beginning, add it.
        if (commandName[0] !== '/') {
            commandName = `/${commandName}`;
        }

        // check if a command is already registered to that key
        if (this.commands[commandName]) {
            return this.Game.logger.warning(`The command ${commandName}, is already registered to the method: ${this.commands[commandName].name}. Registration ignored.`);
        }

        // register the command and the method it should execute
        this.commands[commandName] = commandMethod;
        this.Game.logger.debug(`Registered command ${commandName} to method ${commandMethod.name}`)
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

        const payload = action.payload.toString().trim().split(' ');

        if (!payload[0]) {
            return resolve();
        }

        const command = payload.shift().toLowerCase();
        const params = payload;

        if (!this.commands[command]) {
            return this.Game.eventToSocket(socket, 'error', `Command ${command} is not a valid command.`);
        }

        this.Game.logger.info('CommandManager::exec', {command, params});
        this.commands[command](socket, command, params, this.Game);
    }

    /**
     * Returns the details for the specified command, if it exists
     * @param  {String} command Command
     * @return {Objct}
     */
    get(command) {
        return new Promise((resolve, reject) => {
            const cmd = this.commands[command];
            
            if (!cmd) {
                return reject(`Command ${command} was not found.`);
            }

            resolve(cmd);
        })
    }

    getTemplate(command) {
        return new Promise((resolve, reject) => {
            const cmd = commandList[command];
            
            if (!cmd) {
                return reject(`Command ${command} was not found.`);
            }

            resolve(cmd);
        });
    }

    /**
     * returns a list of all available commands in game
     * @return {Object}
     */
    getList() {
        return commandList;
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