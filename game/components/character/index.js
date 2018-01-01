/*
{
    "user_id" : "5a410f4b13137e70f82ba331",
    "name" : "SirMrE",
    "stats": {
        "money" : 896,
        "bank" : 896,
        "health_max" : 100,
        "health" : 56,
    }
    "location" : [ 
        "london", 
        1, 
        1
    ],
    "inventory" : {
        "apple" : {
            "durability" : 14
        },
        "sword" : {
            "553bac5f-f0ff-4176-a28a-c3e95ec1e7f8" : {
                "durability" : 100
            },
            "46d78fd3-a066-4a86-b794-377bc5d2f405" : {
                "durability" : 100
            },
            "eac6812e-f57e-472f-a5a7-e7f9b21aafb6" : {
                "durability" : 100
            }
        }
    }
}
*/

class Character {
    constructor(character) {
        Object.assign(this, character);
    }

    // Location
    getLocation() {
        return this.location;
    }

    setLocation(map, x, y) {
        this.location = { map, x, y };
        return this.location;
    }

    // Inventory
    getInventory() {
        return this.inventory;
    }

    setInventory(inventory) {
        this.inventory = inventory;
        return this.inventory;
    }

    // Stats
    getStats() {
        return this.stats;
    }

    getStat(stat_name) {
        return this.stats[stat_name];
    }

    setStat(stat_name, value) {
        this.stats[stat_name] = value;
        return this.stats[stat_name];
    }
}

export default Character;