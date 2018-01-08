import fs from 'fs';

// manager specific imports
import GameMap from './object';

export default class MapManager {
    constructor(Game) {
        this.Game = Game;
        // the list of maps to manage
        this.maps = {};
    }

    /**
     * Load all game maps
     * @return {Promise}
     */
    load() {
        return new Promise((resolve, rejecte) => {
            // get the list of map files in our data maps directory
            const maplist = fs.readdirSync(`${__dirname}/../../data/maps`);
            let loadedmaps = 0;

            // loop each of our mapfiles
            maplist.map((mapname) => {
                let mapData = require(`${__dirname}/../../data/maps/${mapname}`);
                this.maps[mapData.id] = new GameMap(this.Game, mapData);

                // generate the map, and once done, increment the counter and resolve if all maps are done.
                this.maps[mapData.id].generate()
                    .then(() => {
                        loadedmaps++;

                        if (loadedmaps === maplist.length) {
                            resolve(maplist.length);
                        }
                    })
                    .catch(console.log)
            })
        })
    }

    getList() {
        const list = {};
        Object.keys(this.maps).map((mapId) => {
            list[mapId] = this.maps[mapId].name;
        })

        return list;
    }
}