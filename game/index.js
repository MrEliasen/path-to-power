// our logger
import winston from 'winston';

// component manager
import accountManager from './components/account/manager';
import characterManager from './components/character/manager';
import socketManager from './components/socket/manager';
import mapManager from './components/map/manager';
import buildingManager from './components/building/manager';
import itemManager from './components/item/manager';
import shopManager from './components/shop/manager';
import commandManager from './components/command/manager';
//import npcManager from './components/npc/manager';

class Game {
    constructor(server, config) {
        this.config = config;

        // setup the winston logger
        this.setupLogger();

        // Manager placeholders
        this.socketManager = new socketManager(this, server);
        this.accountManager = new accountManager(this);
        this.characterManager = new characterManager(this);
        this.mapManager = new mapManager(this);
        this.buildingManager = new buildingManager(this);
        this.itemManager = new itemManager(this);
        this.shopManager = new shopManager(this);
        this.commandManager = new commandManager(this);
        //this.npcManager = new npcManager(this);

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
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'combined.log' })
            ]
        });

        // if we are not in a production environment, add console logging as well
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }

        this.logger.info('Logger initiated.');
    }

    async init() {
        await this.mapManager.load().then(() => {
            console.log('MAPS LOADED');
        });

        /*await this.npcManager.load().then(() => {
            console.log('NPCS LOADED');
        })*/

        // Listen for connections
        this.socketManager.listen()
    }
}

export default Game;