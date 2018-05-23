import escapeStringRegex from 'escape-string-regexp';
import {COMMAND_CHAT_COMMAND} from 'shared/actionTypes';
import commandCommands from './commands';
import {deepCopyObject} from '../../helper';

/**
 * Command class
 */
export default class CommandManager {
    /**
     * Class constructor
     * @param  {Game} Game The main Game object
     */
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
        this.registerManager(commandCommands);
        console.log('COMMAND MANAGER LOADED');
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

    /**
     * Register a command object
     * @param  {String}  commandName   Command, eg /say
     * @param  {Object}  commandObject The command object from the component/<name>/command.js
     * @param  {Boolean} isAlias       Whether this is an alias of a command
     */
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
    async onDispatch(socket, action) {
        if (action.type !== COMMAND_CHAT_COMMAND) {
            return;
        }

        if (!action.payload) {
            return;
        }

        // Check to see if it's an object and if it's empty as well
        // This bug happens when a player sends an empty string as a command
        // and the socket manager converting empty strings into an empty object: socket/manager.js:161
        if (action.payload.constructor === Object && Object.keys(action.payload).length === 0) {
            return;
        }

        const payload = action.payload.toString().trim();

        if (!payload[0]) {
            return;
        }

        let params = this.parseParameters(payload);
        const command = params.shift().toLowerCase();

        if (!this.commands[command]) {
            return this.Game.eventToSocket(socket, 'error', `Command ${command} is not a valid command.`);
        }

        const character = this.Game.characterManager.get(socket.user.user_id);
        // true by default, as we assume all commands are only meant for in-game use; unless explicitly told otherwise
        const inGameCommand = typeof this.commands[command].inGameCommand === 'undefined' ? true : this.commands[command].inGameCommand;

        if (!character && inGameCommand) {
            return;
        }

        try {
            const parsedParams = await this.validate(character, params, this.commands[command].params, socket);

            // If the params is a string and not an array, something went wrong
            if (typeof parsedParams === 'string') {
                this.Game.eventToSocket(socket, 'error', parsedParams);
                return this.Game.eventToSocket(socket, 'multiline', this.getInfo(command));
            }

            return this.commands[command].method(
                socket,
                character,
                command,
                parsedParams,
                {
                    modifiers: this.commands[command].modifiers ? deepCopyObject(this.commands[command].modifiers) : null,
                    description: this.commands[command].description,
                },
                this.Game
            );
        } catch (err) {
            this.Game.onError(err, socket);
        }
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
                    modifiers: this.commands[command].modifiers || {},
                };

                listOfCommands[command] = data;
            }
        });

        return listOfCommands;
    }

    /**
     * Get the command object matching the name
     * @param  {String} commandName The command to get
     * @return {Object}             The command object or null
     */
    getCommand(commandName) {
        commandName = commandName.toLowerCase();

        // check if the commandName begins with a forward slash
        if (commandName[0] !== '/') {
            commandName = '/' + commandName;
        }

        // check if the command exists (if its not an alias)
        let command = this.commands[commandName] || null;

        // if the command was not found, check aliases
        if (!command) {
            // otherwise see if there are any items which begins with the string
            for (let commandId in this.commands) {
                if (this.commands[commandId].aliases.includes(commandName)) {
                    command = this.templates[commandId];
                    break;
                }
            }
        }

        return command;
    }

    /**
     * Find a specific target at the given location, by name
     * @param  {String}   findName      The name, or part of, to search for
     * @param  {Object}   location      A character/npc location object
     * @param  {Bool}     ignoreNPCs    Whether to include NPCs or not
     * @param  {Bool}     ignorePlayers Whether to include players or not
     * @param  {String}   user_id       The character ID of the user who we should exclude from the list
     */
    findAtLocation(findName, location, ignoreNPCs = false, ignoreCharacters = false, user_id = null) {
        // get he list of players and NPCS at the grid
        const charactersAtGrid = this.Game.characterManager.getLocationList(location.map, location.x, location.y);
        const NPCsAtGrid = this.Game.npcManager.getLocationList(location.map, location.x, location.y);
        let characters = [];

        if (!ignoreCharacters) {
            // Find target matching the name exactly
            characters = charactersAtGrid.filter((user) => {
                return user.name_lowercase === findName && !user.hidden && user.user_id !== user_id;
            });

            if (!characters.length) {
                // Otherwise find target matching the beginning of the name
                characters = charactersAtGrid.filter((user) => {
                    return user.name_lowercase.indexOf(findName) === 0 && !user.hidden && user.user_id !== user_id;
                });
            }
        }

        const NPCs = ignoreNPCs ? [] : NPCsAtGrid.filter((npc) => {
            return `${npc.name} the ${npc.type}`.toLowerCase().indexOf(findName) === 0;
        });

        // Check if there where any matches
        if (!characters.length && !NPCs.length) {
            return 'There are nobody around with that name.';
        }

        // get the full list of potential targets
        let matchingTargets = characters.concat(NPCs);

        return matchingTargets[0];
    }

    /**
     * Parses a commands parameters
     * @param  {String} paramString Command string, without the command
     * @return {array}              Array of parameters
     */
    parseParameters(paramString) {
        const stringLength = paramString.length;
        const params = [];
        let insideString = false;
        let param = '';
        let char;

        for (let i = 0; i < stringLength; i++) {
            char = paramString[i];

            if (char == ' ' && !insideString) {
                params.push(param);
                param = '';
            } else {
                if (char == '"') {
                    insideString = !insideString;
                }

                param += char;
            }
        }

        if (param.length) {
            params.push(param);
        }

        return params;
    }

    /**
     * Strips the " character from the beginning and end of a parameter
     * @param  {String} param The parameter
     * @return {String}       The parameter with the "" encapsulation
     */
    stripEncapsulation(param) {
        if (param[0] === '"') {
            param = param.substring(1, param.length - 1);
        }

        return param;
    }

    /**
     * Validates a command's params
     * @param  {Character}        character The character object of the player executing the command
     * @param  {array}            params    Params from the client commandnt command
     * @param  {array}            rules     Param rules for the command
     * @param  {Socket.io Socket} socket    Param rules for the command
     * @return {Promise}
     */
    async validate(character, msgParams, cmdParams, socket) {
        // check if there are any params defined for the command at all
        if (!cmdParams) {
            return [];
        }

        // prepare the params, so they match the number of expected params.
        msgParams = msgParams.slice(0, cmdParams.length - 1).concat(msgParams.slice(cmdParams.length - 1).join(' '));

        // run the params through each of the rules
        for (let index = 0; index < cmdParams.length; index++) {
            let param = cmdParams[index];

            // remove encapsulation from the parameter
            msgParams[index] = this.stripEncapsulation(msgParams[index]);

            // only if the parameter has rules..
            if (param.rules.length) {
                let rules = param.rules.toLowerCase().split('|');

                // check if the message param is not set and is optional
                // if so, we will ignore the rules.
                if (!msgParams[index] && !rules.includes('required')) {
                    break;
                }

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
                            if (typeof msgParam === 'undefined' || !msgParam) {
                                return `Missing parameter: ${param.name}`;
                            }
                            break;

                        case 'options':
                            const options = rule[1].split(',');
                            value = msgParam;

                            if (!options.includes(value.toLowerCase())) {
                                return `${param.name} must be one of the follow: ${options.join(', ')}.`;
                            }
                            break;

                        case 'integer':
                            value = parseInt(msgParam, 10);

                            if (isNaN(value) || parseFloat(msgParam, 10) % 1 !== 0) {
                                return `${param.name} must be a integer.`;
                            }
                            break;

                        case 'float':
                            value = parseFloat(msgParam, 10);

                            if (isNaN(value)) {
                                return `${param.name} must be a float.`;
                            }
                            break;

                        case 'min':
                            if (isNaN(msgParam) || msgParam < parseFloat(rule[1], 10)) {
                                return `${param.name} cannot be less than ${rule[1]}.`;
                            }
                            break;

                        case 'max':
                            if (isNaN(msgParam) || msgParam > parseFloat(rule[1], 10)) {
                                return `${param.name} cannot be greater than ${rule[1]}.`;
                            }
                            break;

                        case 'minlen':
                            if (msgParam.length < parseInt(rule[1], 10)) {
                                return `${param.name} must be at least ${rule[1]} characters long.`;
                            }
                            break;

                        case 'maxlen':
                            if (msgParam.length > parseInt(rule[1], 10)) {
                                return `${param.name} cannot be longer than ${rule[1]} characters.`;
                            }
                            break;

                        case 'alphanum':
                            if (msgParam !== escapeStringRegex(msgParam.toString()).replace(/[^a-z0-9]/gi, '')) {
                                return `${param.name} may only consist of alphanumeric characters (a-z, 0-9).`;
                            }
                            break;

                        case 'direction':
                            const directions = [
                                'north', 'east', 'south', 'west',
                                'n', 'e', 's', 'w',
                            ];

                            if (!directions.includes(msgParam.toLowerCase())) {
                                return `${param.name} does not appear to be a valid direction.`;
                            }
                            break;

                        case 'faction':
                            value = this.Game.factionManager.getByName(msgParam);

                            if (!value) {
                                return `The ${param.name} is not a valid faction.`;
                            }
                            break;

                        case 'gamemap':
                            value = this.Game.mapManager.getByName(msgParam);

                            if (!value) {
                                return `The ${param.name} is not a valid location.`;
                            }
                            break;

                        case 'slot':
                            // make sure the target inventory slot is not another equipment slot
                            if (!['armour-body', 'weapon-ranged', 'weapon-melee', 'weapon-ammo'].includes(msgParam)) {
                                // make sure the target inventory slot is within the inventory size range
                                const inventoryNumber = parseInt(msgParam.replace('inv-', ''), 10);

                                if (isNaN(inventoryNumber) || inventoryNumber < 0 || inventoryNumber >= character.stats.inventorySize) {
                                    return `The ${param.name} is not a valid inventory slot.`;
                                }
                            }

                            value = msgParam;
                            break;

                        case 'shop':
                            if (!character) {
                                return 'Unable to perform command. It requires you to be logged into a character.';
                            }

                            value = this.Game.structureManager.getWithShop(character.location.map, character.location.x, character.location.y);

                            if (value) {
                                return `The ${param.name} is not a valid shop, at your current location.`;
                            }
                            break;

                        case 'item':
                            if (!rule[1]) {
                                value = this.Game.itemManager.getTemplateByName(msgParam.toLowerCase());

                                // if no item was found by name, see if the msgParam was an itemId instead
                                if (!value) {
                                    value = this.Game.itemManager.getTemplate(msgParam);
                                }
                            } else {
                                if (rule[1] === 'id') {
                                    value = this.Game.itemManager.getTemplate(msgParam);
                                } else if (rule[1] === 'name') {
                                    value = this.Game.itemManager.getTemplateByName(msgParam.toLowerCase());
                                }
                            }

                            // no item found by name or ID
                            if (!value) {
                                return `The ${param.name} is not a valid item.`;
                            }
                            break;

                        case 'character':
                            value = await this.Game.characterManager.load(socket.user.user_id, msgParam.toLowerCase());

                            // no item found by name or ID
                            if (!value) {
                                return `You do not have a character named ${param.name}.`;
                            }
                            break;

                        case 'player':
                        case 'target':
                        case 'npc':
                            if (!character) {
                                return 'Unable to perform command. It requires you to be logged into a character.';
                            }

                            // if there is no rule modifiers, assume no location restrictions
                            // and player (since actions towards NPCs are inherently restricted to grid)
                            if (!rule[1]) {
                                value = this.Game.characterManager.getByName(msgParam);

                                if (!value) {
                                    return `There is no ${param.name} online by that name.`;
                                }
                                break;
                            }

                            // assume we will search in the grid by detault
                            let location = {
                                ...character.location,
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
                                character.user_id,
                            );

                            if (typeof value === 'string') {
                                return value;
                            }
                            break;
                    };

                    msgParams[index] = value;
                }
            }
        }

        return msgParams;
    }

    /**
     * Generates a helper output for a command
     * @param  {Mixed}  command  Command Object or string. if string, it will search for the commands
     * @return {Mixed}           Message array if found, null otherwise.
     */
    getInfo(command) {
        if (typeof command === 'string') {
            command = this.getCommand(command);
            // if the command does not exist
            if (!command) {
                return null;
            }
        }

        const tab = '    ';
        let message = [
            command.description,
            'Command:',
            `${tab}${command.command}`,
        ];

        // add aliases if found
        if (command.aliases && command.aliases.length) {
            message.push('Aliases:');
            message.push(tab + command.aliases.join(', '));
        }

        // add params if found
        if (command.params && command.params.length) {
            message.push('Arguments:');

            command.params.forEach((param) => {
                const optional = param.rules ? !param.rules.includes('required') : true;
                // append the param to the command syntax
                message[2] = message[2] + (optional ? ` [${param.name}]` : ` <${param.name}>`);
                // add the argument
                message.push(`${tab}${param.name}: ${(optional ? '(optional) ' : '')}${param.desc}`);
            });
        }

        return message;
    }
}
