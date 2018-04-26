import Promise from 'bluebird';
import child_process from 'child_process';

// component manager
import UserManager from './components/user/manager';
import CharacterManager from './components/character/manager';
import SocketManager from './components/socket/manager';
import MapManager from './components/map/manager';
import StructureManager from './components/structure/manager';
import ItemManager from './components/item/manager';
import LootManager from './components/loot/manager';
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
    constructor(server, config, logger, autoInit = true) {
        this.config = config;

        // if we are not in a production environment, add console logging as well
        if (process.env.NODE_ENV === 'development') {
            // enable long stack traces to promises, while in dev
            Promise.longStackTraces();
        }

        // setup the winston logger
        this.logger = logger;

        // will hold the latest commit ID of the server
        this.version = '';

        // Game timers
        this.timers = [];

        // Manager placeholders
        this.socketManager = new SocketManager(this, server);
        this.userManager = new UserManager(this);
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
        this.lootManager = new LootManager(this);

        if (autoInit) {
            // load game data
            this.init();
        }
    }

    /**
     * Init the game server managers
     */
    async init() {
        // set the current server revision/version
        // TODO: Before 0.1.0 is released - implement husky package and auto bump version on push.
        this.version = child_process.execSync('git rev-parse --short=7 HEAD').toString().trim();

        await this.itemManager.init();
        await this.mapManager.init();
        await this.factionManager.init();
        await this.shopManager.init();
        await this.structureManager.init();
        await this.commandManager.init();
        await this.characterManager.init();
        await this.skillManager.init();

        // setup autosave
        this.setupGameTimers();

        // Listen for connections
        this.socketManager.listen();
    }

    /**
     * Timer call method
     * @param  {String} timerName The name of the timer
     */
    async onTimer(timerName) {
        this.logger.debug(`Running timer ${timerName}`);

        switch (timerName) {
            case 'autosave':
                // NOTE: if you want to add anything to the auto save, do it here
                return this.characterManager.saveAll();

            case 'newday':
                // update the pricing on items, with the priceRange array defined.
                // We update the templates as they will be used for the sell and buy prices
                this.itemManager.updatePrices();
                // NOTE: if you want to add anything to the "new day" timer, do it here
                await this.shopManager.resupplyAll();
                this.socketManager.dispatchToRoom('game', addNews('The sun rises once again, and wave of new drugs flood the streets.'));
                // update all client's inventories with new prices etc.
                this.characterManager.updateAllClients('inventory');
        }
    }

    /**
     * Handles error catches, logging the error and (if defined) notifying the user.
     * @param  {Obj}   err  The error object
     * @param  {Mixed} user Socket.io Socket or user_id
     */
    onError(err, user) {
        this.logger.error(err);

        if (!user) {
            return;
        }

        if (typeof user === 'string') {
            this.eventToUser(user, 'error', 'Something went wrong. Please try again in a moment.');
        } else {
            this.eventToSocket(user, 'error', 'Something went wrong. Please try again in a moment.');
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
            ' _____      _   _       _______      _____',
            `|  __ \\    | | | |     |__   __|    |  __ \\ Revision: ${this.version.toUpperCase()}`,
            '| |__) |_ _| |_| |__      | | ___   | |__) |____      _____ _ __ ',
            '|  ___/ _` | __| \'_ \\     | |/ _ \\  |  ___/ _ \\ \\ /\\ / / _ \\ \'__|',
            '| |  | (_| | |_| | | |    | | (_) | | |  | (_) \\ V  V /  __/ |',
            '|_|   \\__,_|\\__|_| |_|    |_|\\___/  |_|   \\___/ \\_/\\_/ \\___|_|',
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
        this.socketManager.dispatchToRoom('game', newEvent(type, message, ignore));
    }

    /**
     * Will run when the server receives a SIGTERM signal/is told to shut down.
     * @param {function} callback Will execute when done.
     */
    shutdown() {
        this.Game.logger.info('Received shutdown signal, Running shutdown procedure');
        return this.characterManager.saveAll();
    }
}

exports.Game = Game;
