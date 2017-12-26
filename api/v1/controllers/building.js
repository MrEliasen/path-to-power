const buildings = {
    hospital: {
        title: "Hospital",
        colour: "#1769ed", 
        commands: {
            "/heal": {
                cost: 1
            }
        }
    },
    veterinarian: {
        title: "Veterinarian",
        colour: "#2ebf1e", 
        commands: {
            "/heal": {
                cost: 3
            }
        }
    }
}

exports.load = function(buildingId) {
    return buildings[buildingId] || null;
} 