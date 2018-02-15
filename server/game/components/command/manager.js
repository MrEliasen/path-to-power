import Promise from 'bluebird';
import escapeStringRegex from 'escape-string-regexp';
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

    /**
     * Registers a manager's associated commands
     * @param  {array} commandsList Array of commands from the managers commmands.js
     */
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
     * @param  {Object}           action The redux action
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

        const character = this.Game.characterManager.getSync(socket.user.user_id);

        this.validate(character, params, this.commands[command].params)
            .then((validParams) => {
                this.commands[command].method(
                    socket,
                    character,
                    command,
                    validParams,
                    {
                        modifiers: this.commands[command].modifiers ? deepCopyObject(this.commands[command].modifiers) : null,
                        description: this.commands[command].description,
                    },
                    this.Game
                );
            })
            .catch((error) => {
                return this.Game.eventToSocket(socket, 'error', error.toString());
            });
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
     * @param  {String}   findName      The name, or part of, to search for
     * @param  {Object}   location      A character/npc location object
     * @param  {Bool}     ignoreNPCs    Whether to include NPCs or not
     * @param  {Bool}     ignorePlayers Whether to include players or not
     */
    findAtLocation(findName, location, ignoreNPCs = false, ignorePlayers = false) {
        // get he list of players and NPCS at the grid
        const playersAtGrid = this.Game.characterManager.getLocationList(location.map, location.x, location.y);
        const NPCsAtGrid = this.Game.npcManager.getLocationList(location.map, location.x, location.y);

        // Find target matching the name
        const characters = ignorePlayers ? [] : playersAtGrid.filter((user) => {
            return user.name_lowercase.indexOf(findName) === 0 && !user.hidden;
        });
        const NPCs = ignoreNPCs ? [] : NPCsAtGrid.filter((npc) => {
            return `${npc.name} the ${npc.type}`.toLowerCase().indexOf(findName) === 0;
        });

        // Check if there where any matches
        if (!characters.length && !NPCs.length) {
            return 'There are nobody around with that name.';
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
                return 'You must be more specific with who you want to target.';
            }
        } else {
            // otherwise select the first and only one in the list
            target = matchingTargets[0];
        }

        return target;
    }

    /**
     * Validates a command's params
     * @param  {Character} player The character object of the player executing the command
     * @param  {array}     params Params from the client commandnt command
     * @param  {array}     rules  Param rules for the command
     * @return {Promise}
     */
    validate(player, msgParams, cmdParams) {
        return new Promise(async (resolve, reject) => {
            // check if there are any params defined for the command at all
            if (!cmdParams) {
                return resolve(msgParams);
            }

            // prepare the params, so they match the number of expected params.
            msgParams = msgParams.slice(0, cmdParams.length - 1).concat(msgParams.slice(cmdParams.length - 1).join(' '));
            // run the params through each of the rules
            for (let index = 0; index < cmdParams.length; index++) {
                let param = cmdParams[index];

                // only if the parameter has rules..
                if (param.rules.length) {
                    let rules = param.rules.toLowerCase().split('|');

                    // will we run through and validate the message parameter the rule is for
                    for (let i = 0; i < rules.length; i++) {
                        let rule = rules[i];

                        // get the corresponding message parameter
                        let msgParam = msgParams[index];
                        // holds the value we will overwrite the parameter with, if the test succeeds.
                        let value = msgParam;
                        //null placeholder for 2nd rule param, if not set
                        rule = rule.split(':').concat([null]);

                        switch (rule[0]) {
                            case 'required':
                                if (typeof msgParam === 'undefined') {
                                    return reject(`Missing parameter: ${param.name}`);
                                }
                                break;

                            case 'number':
                                value = parseInt(msgParam, 10);

                                if (isNaN(value)) {
                                    return reject(`${param.name} must be a number.`);
                                }
                                break;

                            case 'min':
                                value = parseInt(msgParam, 10);

                                if (!isNaN(value) && value < parseInt(rule[1], 10)) {
                                    return reject(`${param.name} cannot be less than ${rule[1]}.`);
                                }
                                break;

                            case 'minlen':
                                if (msgParam.length < parseInt(rule[1], 10)) {
                                    return reject(`${param.name} must be at least ${rule[1]} characters long.`);
                                }
                                break;

                            case 'maxlen':
                                if (msgParam.length > parseInt(rule[1], 10)) {
                                    return reject(`${param.name} cannot be longer than ${rule[1]} characters.`);
                                }
                                break;

                            case 'alphanum':
                                if (msgParam !== escapeStringRegex(msgParam.toString()).replace(/[^a-z0-9]/gi, '')) {
                                    return reject(`${param.name} may only consist of alphanumeric characters (a-z, 0-9).`);
                                }
                                break;

                            case 'faction':
                                value = await this.Game.factionManager.getByName(msgParam).catch(() => {
                                    return reject(`The ${param.name} is not a valid faction.`);
                                });
                                break;

                            case 'player':
                            case 'target':
                            case 'npc':
                                // if there is no rule modifiers, assume no location restrictions
                                // and player (since actions towards NPCs are inherently restricted to grid)
                                if (!rule[1]) {
                                    value = this.Game.characterManager.getByNameSync(msgParam);

                                    if (!value) {
                                        return reject(`There is no ${param.name} online by that name.`);
                                    }
                                    break;
                                }

                                // assume we will search in the grid by detault
                                let location = {
                                    ...player.location,
                                };

                                // if rule modifier is set to map, null out the x an y so
                                // we will search the map instead of grid
                                if (rule[1] !== 'grid') {
                                    location.x = null;
                                    location.y = null;
                                }

                                value = this.findAtLocation(
                                    msgParam,
                                    location,
                                    rule[0] === 'player',
                                    rule[0] === 'npc',
                                );

                                if (typeof value === 'string') {
                                    return reject(value);
                                }
                                break;
                        };

                        msgParams[index] = value;
                    }
                }
            }

            resolve(msgParams);
        });
    }

    /*
    params: [
        {
            name: 'Target',
            desc: 'The name of the player you want to send a private message to',
            rules: 'required|character:grid',
        },
        {
            name: 'Message',
            desc: 'The message you wish to send to the player.',
            rules: 'required|minlen:1|maxlen:20',
        },
    ],
     */
}
