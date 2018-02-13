import {SHOP_LOAD} from '../../../shared/types';

function cmdShop(socket, command, params, cmdObject, Game) {
    const shopName = params.join(' ').toLowerCase();

    // Fetch the character first
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get the structures list at the character location
            Game.structureManager.getWithShop(character.location.map, character.location.x, character.location.y)
                .then((shops) => {
                    let shop;

                    // if we get multiple structures, but only one parameter, the client didnt specify
                    // the shop to use the command with.
                    if (shops.length > 1 && params.length < 1) {
                        return Game.eventToSocket(socket, 'error', 'Missing shop name. There are multiple shops at this location use: /shop <shop name>');
                    }

                    // overwrite if they specified a shop, and its name didn't match their criteria
                    if (params.length >= 1) {
                        shop = shops.find((obj) => obj.name.toLowerCase().indexOf(shopName) === 0);
                    } else {
                        shop = shops[0];
                    }

                    if (!shop) {
                        return Game.eventToSocket(socket, 'error', 'No shop at this location, matching what you are after.');
                    }

                    Game.socketManager.dispatchToSocket(socket, {
                        type: SHOP_LOAD,
                        payload: shop.toObject(),
                    });
                })
                .catch(() => {
                    // if no shops are found at the location
                    return Game.eventToSocket(socket, 'error', 'There are no shops in the area.');
                });
        })
        .catch((err) => {
            Game.logger.error(err);
        });
}

function cmdBuy(socket, command, params, cmdObject, Game) {
    const npcName = params.join(' ').toLowerCase();

    // Fetch the character first
    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            // get the NPC list at the character location
            const NPCs = Game.npcManager.getLocationList(character.location.map, character.location.x, character.location.y);

            if (!NPCs || !NPCs.length) {
                return Game.eventToSocket(socket, 'error', 'There are no one around with that name.');
            }

            const NPC = NPCs.find((obj) => obj.name.toLowerCase().indexOf(npcName) === 0);

            // if there are no NPC with that name, let them know
            if (!NPC) {
                return Game.eventToSocket(socket, 'error', 'There are no one around with that name.');
            }

            // check if the NPC has a "shop" assigned
            if (!NPC.shop) {
                return Game.eventToSocket(socket, 'error', `${NPC.name} is not selling or buying anything.`);
            }

            Game.socketManager.dispatchToSocket(socket, {
                type: SHOP_LOAD,
                payload: NPC.shop.toObject(),
            });
        })
        .catch(() => {});
}

module.exports = [
    {
        command: '/shop',
        aliases: [],
        description: 'View the shop. Usage: /shop <building name>. If there is only one shop at a location, you can omit the building name.',
        method: cmdShop,
    },
    {
        command: '/trade',
        aliases: [
            '/sell',
            '/buy',
        ],
        description: 'Opens a NPC\'s shop, if one exists. Usage: /trade <npc name>',
        method: cmdBuy,
    },
];
