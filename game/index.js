// component manager
import accountManager from './components/account/manager';
import characterManager from './components/character/manager';
import socketManager from './components/socket/manager';
/*import buildingManager from './components/building/manager';
import commandManager from './components/command/manager';
import itemManager from './components/item/manager';
import mapManager from './components/map/manager';
import npcManager from './components/npc/manager';
import shopManager from './components/shop/manager';*/

class Game {
    constructor(server, config) {
        this.config = config;
        console.log('Game')

        // Manager placeholders
        this.socketManager = new socketManager(this, server);
        this.accountManager = new accountManager(this);
        this.characterManager = new characterManager(this);
        /*this.buildingManager = new buildingManager(this);
        this.commandManager = new commandManager(this);
        this.itemManager = new itemManager(this);
        this.mapManager = new mapManager(this);
        this.npcManager = new npcManager(this);
        this.shopManager = new shopManager(this);*/

        // load game data
        this.init();
    }

    init() {
        /*await this.buildingManager.load().then(() => {
            console.log('BUILDINGS LOADED');
        })
        await this.itemManager.load().then(() => {
            console.log('ITEMS LOADED');
        })
        await this.mapManager.load().then(() => {
            console.log('MAPS LOADED');
        })
        await this.shopManager.load().then(() => {
            console.log('SHOPS LOADED');
        })
        await this.npcManager.load().then(() => {
            console.log('NPCS LOADED');
        })*/

        // Listen for connections
        this.socketManager.listen()
    }
}

export default Game;