// manager specific imports
import Building from './object';
import buildings from '../../data/buildings.json' ;

export default class BuildingManager {
    constructor(Game) {
        this.Game = Game;
        // list of buildings to manage
        this.buildings = [];
    }

    add(mapId, x, y, buildingId) {
        this.Game.logger.info('BuildingManager::add', {mapId, buildingId, x, y})

        const buildingData = buildings[buildingId];
        const newBuilding = new Building(this.Game, buildingData, {map: mapId, x, y}); 
        // add building to the managed buildings array
        this.buildings.push(newBuilding);

        return newBuilding;
    }
}