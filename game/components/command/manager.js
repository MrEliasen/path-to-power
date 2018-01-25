import Promise from 'bluebird';
import { GAME_COMMAND } from './types';
import commandList from '../../data/commands.json';
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

    /**
     * returns a list of all available commands in game
     * @return {Object}
     */
    getList() {
        return this.commandList;
    }
}