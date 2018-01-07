export default class Building {
    constructor(Game, buildingData, location) {
        this.Game = Game;
        // add the building details
        Object.assign(this, buildingData);
        // add the location of the building
        this.location = location;
    }
}