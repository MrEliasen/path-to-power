import { buildings } from '../data';
import { commandList } from '../commands';

/*
    {
        title: "Hospital",
        colour: "#1769ed", 
        commands: {
            "/heal": {
                cost: 1
            }
        }
    }
*/
class Building {
    constructor(buildingId) {
        const building = buildings[buildingId];

        if (!building) {
            return null;
        }

        Object.keys(building).map((statKey) => {
            this[statKey] = building[statKey];
        });
    }

    consume() {
        // make sure the item is a consumable item
        if (this.type !== 'consumable') {
            return;
        }

        // check item durability
        if (!this.stat_durability) {
            return;
        }

        // reduce durability of the consumable
        this.durability(this.stat_durability - 1);

        // return the effect of the consumable
        return this.effects;
    }

    getCommand(userId, command) {
        if (!this.commands[command]) {
            return null;
        }

        if (!commandList[command]) {
            return null;
        }

        return commandList[command](userId, this.commands[command])
    }

    getTitle() {
        return this.title;
    }

    getColour() {
        return this.colour;
    }
}