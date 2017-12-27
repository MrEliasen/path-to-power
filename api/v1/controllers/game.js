const CharacterController = require('./character');
const Character = require('../models/character');
const GameMap = require('./map');
const items = require('../assets/items').items;

// Game variables
const playerList = {
    online: {},
    offline: {}
};

function fetchGameData() {
    return {
        items: items
    }
}

function addOnlinePlayer(userId, playerObject, callback) {
    // remove player from the offline list
    delete playerList['offline'][userId];

    // Check if the player is already in the "online players list"; if not, add them!
    if (!Object.keys(playerList['online']).includes(userId)) {
        playerList['online'][userId] = playerObject;
    }

    callback();
}

function addOfflinePlayer(userId, callback) {
    // remove them from the online players list
    if (playerList['online'][userId]) {
        playerList['offline'][userId] = {...playerList['online'][userId]};
        delete playerList['online'][userId];
    }

    callback();
}

function getPlayerList(type = 'online') {
    return playerList[type];
}


function shutdown(callback) {
    callback();
}

function saveCharacter(userId) {
    CharacterController.getCharacter(userId, function(playerData) {
        GameMap.getPlayerPosition(userId, function (position) {
            CharacterController.getInventory(userId, function(inventory) {
                Character.findOne({ userId: userId }, function(err, character) {
                    if (err) {
                        return console.log(err);
                    }

                    if (playerData) { 
                        character.money = playerData.money;
                        character.health = playerData.health;
                        character.health_max = playerData.health_max;
                    }

                    character.location = [];
                    if (position.mapId) { 
                        character.location = [
                            position.mapId,
                            position.x,
                            position.y
                        ];
                    }

                    character.inventory = inventory;

                    character.save(function(error) {
                        if (error) {
                            console.log(`Failed to save character ${userId}`);
                        }
                    })
                })
            })
        })
    })
}

function saveAll() {
    const players = Object.keys(Object.assign(playerList['offline'], playerList['online']));
    players.map(saveCharacter)
}

module.exports = {
    shutdown: shutdown,
    saveAll: saveAll,
    saveCharacter: saveCharacter,
    playerList: playerList,
    addOnlinePlayer: addOnlinePlayer,
    addOfflinePlayer: addOfflinePlayer,
    getPlayerList: getPlayerList,
    fetchGameData: fetchGameData
}