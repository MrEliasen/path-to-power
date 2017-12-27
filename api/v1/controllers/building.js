const buildings = require('../assets/buildings').buildings;

exports.load = function(buildingId) {
    return buildings[buildingId] || null;
} 