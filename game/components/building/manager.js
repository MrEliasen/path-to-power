// manager specific imports
import Building from './object';
import buildings from '../../data/buildings.json' ;

export default class BuildingManager {
    constructor(Game) {
        this.Game = Game;
        // list of buildings to manage
        this.buildings = [];
    }

    add(map_id, x, y, building_id) {
        this.Game.logger.info('BuildingManager::add', {map_id, building_id, x, y})

        const buildingData = buildings[building_id];
        const newBuilding = new Building(this.Game, buildingData, {map: map_id, x, y}); 
        // add building to the managed buildings array
        this.buildings.push(newBuilding);

        return newBuilding;
    }
}