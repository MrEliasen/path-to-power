// our logger
import winston from 'winston';
import Promise from 'bluebird';

// component manager
import accountManager from './components/account/manager';
import characterManager from './components/character/manager';
import socketManager from './components/socket/manager';
import mapManager from './components/map/manager';
import structureManager from './components/structure/manager';
import itemManager from './components/item/manager';
import shopManager from './components/shop/manager';
import commandManager from './components/command/manager';
import factionManager from './components/faction/manager';
import abilityManager from './components/ability/manager';
import skillManager from './components/skill/manager';
import cooldownManager from './components/cooldown/manager';
import npcManager from './components/npc/manager';

import { newEvent, addNews } from './actions';

class Game {
    constructor(server, config) {
        this.config = config;

        // setup the winston logger
        this.setupLogger();

        // Game timers
        this.timers = [];

        // Manager placeholders
        this.socketManager = new socketManager(this, server);
        this.accountManager = new accountManager(this);
        this.characterManager = new characterManager(this);
        this.mapManager = new mapManager(this);
        this.structureManager = new structureManager(this);
        this.itemManager = new itemManager(this);
        this.shopManager = new shopManager(this);
        this.commandManager = new commandManager(this);
        this.factionManager = new factionManager(this);
        this.abilityManager = new abilityManager(this);
        this.skillManager = new skillManager(this);
        this.cooldownManager = new cooldownManager(this);
        this.npcManager = new npcManager(this);

        // load game data
        this.init();
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
                    timestamp: true
                }),
                new winston.transports.File({
                    filename: 'combined.log',
                    level: 'warning',
                    timestamp: true
                }),
                new winston.transports.File({
                    filename: 'debug.log',
                    level: 'debug',
                    timestamp: true
                })
            ]
        });

        // if we are not in a production environment, add console logging as well
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));

            // enable long stack traces to promises, while in dev
            Promise.longStackTraces();
        }

        this.logger.info('Logger initiated.');
    }

    async init() {
        await this.itemManager.init().then((count) => {
            console.log(`${count} ITEMS LOADED`);
        });

        await this.mapManager.init().then((count) => {
            console.log(`${count} MAPS LOADED`);
        });

        await this.factionManager.init().then((count) => {
            console.log(`${count} FACTIONS LOADED`);
        });

        await this.shopManager.init().then(() => {
            console.log(`SHOPS LOADED`);
        });

        await this.structureManager.init().then(() => {
            console.log(`STRUCTURES LOADED`);
        });

        await this.commandManager.init().then(() => {
            console.log(`COMMANDS LOADED`);
        });

        await this.characterManager.init().then(() => {
            console.log(`CHARACTERS LOADED`);
        });

        await this.skillManager.init().then(() => {
            console.log(`SKILLS LOADED`);
        });

        await this.npcManager.init().then((count) => {
            console.log(`${count} NPCS LOADED`);
        });

        // setup autosave
        this.setupGameTimers();

        // Listen for connections
        this.socketManager.listen();
    }

    onTimer(timerName) {
        let callback = () => {};

        switch(timerName) {
            case 'autosave':
                callback = () => {
                    // NOTE: if you want to add anything to the auto save, do it here
                    this.characterManager.saveAll();
                };
                break;
            case 'newday':
                callback = () => {
                    // NOTE: if you want to add anything to the "new day" timer, do it here
                    this.shopManager.resupplyAll();
                    this.socketManager.dispatchToServer(addNews('The sun rises once again, and wave of new drugs flood the streets.'));
                };
                break;
        }

        this.logger.debug(`Running timer ${timerName}`);
        callback();
    }

    /**
     * Setup the game timers (like new day and autosave)
     */
    setupGameTimers() {
        this.timers = this.config.game.timers.filter((timer) => timer.enabled).map((timer) => {
            return {
                name: timer.name,
                timer: setInterval(this.onTimer.bind(this), timer.interval, timer.name)
            }
        });
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
}

export default Game;