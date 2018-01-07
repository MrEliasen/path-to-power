export default class GameMap {
    constructor(Game, data) {
        this.Game = Game;
        Object.assign(this, data);
    }

    generate() {
        return new Promise((resolve, reject) => {
            // generate the map grid?
            // Load all builds for map (with the BuildingManager)
            this.buildings.map((building) => {
                this.Game.buildingManager.add(this.id, building.x, building.y, building.id);
            })
            resolve();
        });
    }

    isValidNewLocation(location, move) {
        // move = { grid: 'x', direction: -1 }
        // location =  { map: 'newyork', y: 1, x: 1 }

        const newPostion = {
            x: location.x,
            y: location.y
        }

        if (move.grid === 'x') {
            newPostion.x = newPostion.x + move.direction;
        } else {
            newPostion.y = newPostion.y + move.direction;
        }

        return (this.isValidPostion(newPostion.x, newPostion.y) ? newPostion : null);
    }

    isValidPostion (x, y) {
        if (!this.grid[y]) {
            return false;
        }

        if (!this.grid[y][x]) {
            return false;
        }

        return true;
    }

    getPosition(x, y) {
        if (!this.isValidPostion(x,y)) {
            return null;
        }

        return this.grid[y][x];
    }
}