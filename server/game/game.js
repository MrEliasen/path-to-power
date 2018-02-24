// our logger
import winston from 'winston';
import Promise from 'bluebird';
import child_process from 'child_process';

// component manager
import AccountManager from './components/account/manager';
import CharacterManager from './components/character/manager';
import SocketManager from './components/socket/manager';
import MapManager from './components/map/manager';
import StructureManager from './components/structure/manager';
import ItemManager from './components/item/manager';
import ShopManager from './components/shop/manager';
import CommandManager from './components/command/manager';
import FactionManager from './components/faction/manager';
import AbilityManager from './components/ability/manager';
import SkillManager from './components/skill/manager';
import CooldownManager from './components/cooldown/manager';
import NpcManager from './components/npc/manager';
import EffectManager from './components/effect/manager';

import {newEvent, addNews} from './actions';

/**
 * The Game object class
 */
class Game {
    /**
     * class constructor
     * @param  {Express} server Express/http server object
     * @param  {Object}  config The server config file object
     */
    constructor(server, config, autoInit = true) {
        this.config = config;

        // setup the winston logger
        this.setupLogger();

        // will hold the latest commit ID of the server
        this.version = '';

        // Game timers
        this.timers = [];

        // Manager placeholders
        this.socketManager = new SocketManager(this, server);
        this.accountManager = new AccountManager(this);
        this.characterManager = new CharacterManager(this);
        this.mapManager = new MapManager(this);
        this.structureManager = new StructureManager(this);
        this.itemManager = new ItemManager(this);
        this.shopManager = new ShopManager(this);
        this.commandManager = new CommandManager(this);
        this.factionManager = new FactionManager(this);
        this.abilityManager = new AbilityManager(this);
        this.skillManager = new SkillManager(this);
        this.cooldownManager = new CooldownManager(this);
        this.npcManager = new NpcManager(this);
        this.effectManager = new EffectManager(this);

        if (autoInit) {
            // load game data
            this.init();
        }
    }

    /**
     * Creates our logger we will be using throughout
     */
    setupLogger() {
        this.logger = winston.createLogger({
            level: (process.env.NODE_ENV !== 'production' ? 'info' : 'warning'),
            format: winston.format.json(),
            transports: [
                new winston.transports.File({
                    filename: 'error.log',
                    level: 'error',
                    timestamp: true,
                }),
                new winston.transports.File({
                    filename: 'info.log',
                    level: 'info',
                    timestamp: true,
                }),
            ],
        });

        this.logger.error = () => {
            console.log(arguments);
        };

       /* // if we are not in a production environment, add console logging as well
        if (process.env.NODE_ENV === 'development') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple(),
            }));

            // enable long stack traces to promises, while in dev
            Promise.longStackTraces();
        }*/

        this.logger.info('Logger initiated.');
    }

    /**
     * Init the game server managers
     */
    async init() {
        // set the current server revision/version
        // TODO: Before 0.1.0 is released - implement husky package and auto bump version on push.
        this.version = child_process.execSync('git rev-parse --short=7 HEAD').toString().trim();

        await this.itemManager.init().then((count) => {
            console.log(`ITEM MANAGER LOADED ${count} ITEMS TEMPLATES`);
        });

        await this.mapManager.init().then((count) => {
            console.log(`MAP MANAGER LOADED ${count} MAPS`);
        });

        await this.factionManager.init().then((count) => {
            console.log(`FACTION MANAGER LOADED ${count} FACTIONS`);
        });

        await this.shopManager.init().then(() => {
            console.log('SHOP MANAGER LOADED');
        });

        await this.structureManager.init().then(() => {
            console.log('STRUCTURES MANAGER LOADED');
        });

        await this.commandManager.init().then(() => {
            console.log('COMMAND MANAGER LOADED');
        });

        await this.characterManager.init().then(() => {
            console.log('CHARACTERS MANAGER LOADED');
        });

        await this.skillManager.init().then(() => {
            console.log('SKILL MANAGER LOADED');
        });

        // setup autosave
        this.setupGameTimers();

        // Listen for connections
        this.socketManager.listen();
    }

    /**
     * Timer call method
     * @param  {String} timerName The name of the timer
     */
    onTimer(timerName) {
        this.logger.debug(`Running timer ${timerName}`);

        switch (timerName) {
            case 'autosave':
                // NOTE: if you want to add anything to the auto save, do it here
                return this.characterManager.saveAll()
                    .catch((err) => {
                        this.logger.error(err.message);
                    });

            case 'newday':
                // NOTE: if you want to add anything to the "new day" timer, do it here
                return this.shopManager.resupplyAll()
                    .then(() => {
                        this.socketManager.dispatchToServer(addNews('The sun rises once again, and wave of new drugs flood the streets.'));
                    })
                    .catch((err) => {
                        this.logger.error(err.message);
                    });
        }
    }

    /**
     * Handles error catches, logging the error and (if defined) notifying the user.
     * @param  {Obj}   err  The error object
     * @param  {Mixed} user Socket.io Socket or user_id
     */
    onError(err, user) {
        this.logger.error(err.message, err);

        if (!user) {
            return;
        }

        if (typeof user === 'string') {
            this.eventToUser(user, 'error', 'Something went wrong. The error was logged. Please try again in a moment.');
        } else {
            this.eventToSocket(user, 'error', 'Something went wrong. The error was logged. Please try again in a moment.');
        }
    }

    /**
     * Setup the game timers (like new day and autosave)
     */
    setupGameTimers() {
        this.timers = this.config.game.timers.filter((timer) => timer.enabled).map((timer) => {
            return {
                name: timer.name,
                timer: setInterval(this.onTimer.bind(this), timer.interval, timer.name),
            };
        });
    }

    /**
     * Send the MOTD to the given socket
     * @param  {Socket IO} socket Socket to send the MOTD to
     */
    sendMotdToSocket(socket) {
        this.eventToSocket(socket, 'multiline', [
            ' ██▓███   ▄▄▄     ▄▄▄█████▓ ██░ ██    ▄▄▄█████▓ ▒█████      ██▓███   ▒█████   █     █░▓█████  ██▀███  ',
            '▓██░  ██▒▒████▄   ▓  ██▒ ▓▒▓██░ ██▒   ▓  ██▒ ▓▒▒██▒  ██▒   ▓██░  ██▒▒██▒  ██▒▓█░ █ ░█░▓█   ▀ ▓██ ▒ ██▒',
            '▓██░ ██▓▒▒██  ▀█▄ ▒ ▓██░ ▒░▒██▀▀██░   ▒ ▓██░ ▒░▒██░  ██▒   ▓██░ ██▓▒▒██░  ██▒▒█░ █ ░█ ▒███   ▓██ ░▄█ ▒',
            '▒██▄█▓▒ ▒░██▄▄▄▄██░ ▓██▓ ░ ░▓█ ░██    ░ ▓██▓ ░ ▒██   ██░   ▒██▄█▓▒ ▒▒██   ██░░█░ █ ░█ ▒▓█  ▄ ▒██▀▀█▄  ',
            '▒██▒ ░  ░ ▓█   ▓██▒ ▒██▒ ░ ░▓█▒░██▓     ▒██▒ ░ ░ ████▓▒░   ▒██▒ ░  ░░ ████▓▒░░░██▒██▓ ░▒████▒░██▓ ▒██▒',
            '▒▓▒░ ░  ░ ▒▒   ▓▒█░ ▒ ░░    ▒ ░░▒░▒     ▒ ░░   ░ ▒░▒░▒░    ▒▓▒░ ░  ░░ ▒░▒░▒░ ░ ▓░▒ ▒  ░░ ▒░ ░░ ▒▓ ░▒▓░',
            '░▒ ░       ▒   ▒▒ ░   ░     ▒ ░▒░ ░       ░      ░ ▒ ▒░    ░▒ ░       ░ ▒ ▒░   ▒ ░ ░   ░ ░  ░  ░▒ ░ ▒░',
            '░░         ░   ▒    ░       ░  ░░ ░     ░      ░ ░ ░ ▒     ░░       ░ ░ ░ ▒    ░   ░     ░     ░░   ░ ',
            `Revision: ${this.version.toUpperCase()}           ░  ░  ░                ░ ░                  ░ ░      ░       ░  ░   ░     `,
            'OPEN SOURCE: https://github.com/MrEliasen/path-to-power',
            'HOW TO PLAY: Click the menu in the top-right.',
            'IN-GAME HELP: If you want get help without leading the game, type: /help',
            'A game by SirMrE. Coded live on Twitch.tv. Big thank you to all my viewers!',
        ]);
    }

    /**
     * dispatch an event to a specific socket
     * @param  {Socket.IO Socket} socket  Socket to dispatch to
     * @param  {String} type    Event type
     * @param  {String} message Event message
     */
    eventToUser(user_id, type, message) {
        this.logger.debug('User Event', {user_id, type, message});
        this.socketManager.dispatchToUser(user_id, newEvent(type, message));
    }

    /**
     * dispatch an event to a specific socket
     * @param  {Socket.IO Socket} socket  Socket to dispatch to
     * @param  {String} type    Event type
     * @param  {String} message Event message
     */
    eventToSocket(socket, type, message) {
        this.logger.debug('Socket Event', {socket: (socket.user || null), type, message});
        this.socketManager.dispatchToSocket(socket, newEvent(type, message));
    }

    /**
     * dispatch an event to a specific room
     * @param  {String} room    The room id
     * @param  {String} type    Event type
     * @param  {String} message Event message
     * @param  {Array} ignore list of user_ids who should ignore the message
     */
    eventToRoom(room, type, message, ignore) {
        this.logger.debug('Room Event', {room, type, message, ignore});
        this.socketManager.dispatchToRoom(room, newEvent(type, message, ignore));
    }

    /**
     * dispatch an event to the server
     * @param  {String} type    Event type
     * @param  {String} message Event message
     * @param  {Array} ignore list of user_ids who should ignore the message
     */
    eventToServer(type, message, ignore) {
        this.logger.debug('Server Event', {type, message, ignore});
        this.socketManager.dispatchToServer(newEvent(type, message, ignore));
    }

    /**
     * Will run when the server receives a SIGTERM signal/is told to shut down.
     * @param {function} callback Will execute when done.
     */
    async shutdown(callback) {
        this.Game.logger.info('Received shutdown signal, Running shutdown procedure');
        await this.characterManager.saveAll()
            .catch((err) => {
                this.logger.error(err.message);
            });

        callback();
    }
}

exports.Game = Game;
