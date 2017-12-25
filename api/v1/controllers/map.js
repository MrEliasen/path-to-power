const fs = require('fs');
let redis;
let gameConfig = require('../config.json');

// holds all the loaded maps
const gameMaps = {};

function loadMap(mapName) {
    const mapPath = fs.realpathSync(`${__dirname}/../assets/maps/${mapName}.json`);

    fs.stat(mapPath, function(err, stats) {
        if (err) {
            return console.error('Map Load Error:', err);
        }

        const mapData = require(mapPath);

        if (gameMaps[mapData.id]) {
            return console.warn(`The map id "${mapData.id}" already exists, for mapfile "${mapName}"`);
        }

        const descriptionCount = gameConfig.mapDescription.length;

        mapData.mapGrid.map((yGrid, y) => {
            yGrid.map((location, x) => {
                mapData.mapGrid[y][x].description = gameConfig.mapDescription[Math.floor(Math.random() * descriptionCount)];
            });
        });

        gameMaps[mapData.id] = mapData;
    });
}

function parseJson(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        return null;
    } 
}

function getMapPosition(mapName, x, y) {
    if (!gameMaps[mapName].mapGrid) {
        return null;
    }

    if (!gameMaps[mapName].mapGrid[y]) {
        return null;
    }

    if (!gameMaps[mapName].mapGrid[y][x]) {
        return null;
    }

    return {
        mapId: mapName,
        map: gameMaps[mapName].mapGrid[y][x],
        title: gameMaps[mapName].title,
        x: x,
        y: y
    }
}

function getPlayerPosition(twitchId, callback) {
    /*
        // position param
        {
            map: "london",
            x: 0,
            y: 0
        }
    */
    redis.get(`player_${twitchId}`, function(err, position) {
        // Error with the redis store
        if (err) {
            return console.log('Redis Error', err);
        }

        // if the JSON string parse, return the JSON object, otherwise, return null.
        position = parseJson(position);

        // if the string is not a valid json string
        if (!position) {
            // default spawn location for the game
            return callback(getMapPosition(gameConfig.spawn.map, gameConfig.spawn.x, gameConfig.spawn.y));
        }

        if (!position.map || (!position.x && position.x !== 0) || (!position.y && position.y !== 0)) {
            // default spawn location for the game
            return callback(getMapPosition(gameConfig.spawn.map, gameConfig.spawn.x, gameConfig.spawn.y));
        }

        let mapPosition = getMapPosition(position.map, position.x, position.y);

        // Check if the map and location is valid
        if (!mapPosition) {
            // check if the map exists at all
            if (!gameMaps[position.map]) {
                // If map does not exists, send the player to the default spawn location.
                return callback(getMapPosition(gameConfig.spawn.map, gameConfig.spawn.x, gameConfig.spawn.y));
            }

            mapPosition = getMapPosition(position.map, gameMaps[position.map].spawn.x, gameMaps[position.map].spawn.y);
        }

        return callback(mapPosition);
    });
}

exports.init = async function(app) {
    config = require('../config.json');
    redis = app.get('redis');

    config.maps.map((mapName) => {
        loadMap(mapName);
    });

    return true;
};

exports.setPlayerPosition = function (twitchId, direction, callback) {
    if (!direction || !direction.grid || (!direction.direction && direction.direction !== 0)) {
        return;
    }

    // get current position
    getPlayerPosition(twitchId, function(currentPosition) {
        switch (direction.grid) {
            case 'y':
                currentPosition.y = currentPosition.y + direction.direction;
                break;
            case 'x':
                currentPosition.x = currentPosition.x + direction.direction;
                break;
        }

        // Check if the move is valid, and not going out of bounds
        const newPosition = getMapPosition(currentPosition.mapId, currentPosition.x, currentPosition.y);

        if (!newPosition) {
            return;
        }

        redis.set(`player_${twitchId}`, JSON.stringify({
            map: newPosition.mapId,
            x: newPosition.x,
            y: newPosition.y
        }), function(err) {
            // Error with the redis store
            if (err) {
                return console.log('Redis Error', err);
            }

            callback(newPosition);
        })
    })
}

exports.getPlayerPosition = getPlayerPosition;