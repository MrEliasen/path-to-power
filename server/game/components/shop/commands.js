import {SHOP_LOAD} from '../../../shared/types';

/**
 * shop command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
async function cmdShop(socket, character, command, params, cmdObject, Game) {
    const shopName = params[0] || null;

    // get the structures list at the character location
    await Game.structureManager.getWithShop(character.location.map, character.location.x, character.location.y)
        .then((shops) => {
            let shop;

            // if we get multiple structures, but only one parameter, the client didnt specify
            // the shop to use the command with.
            if (shops.length > 1 && params.length < 1) {
                return Game.eventToSocket(socket, 'error', 'Missing shop name. There are multiple shops at this location use: /shop <shop name>');
            }

            // overwrite if they specified a shop, and its name didn't match their criteria
            if (params.length >= 1) {
                shop = shops.find((obj) => obj.name.toLowerCase().indexOf(shopName.toLowerCase()) === 0);
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
        .catch((err) => {
            Game.logger.error(err.message);
            // if no shops are found at the location
            return Game.eventToSocket(socket, 'error', 'There are no shops in the area.');
        });
}

/**
 * trade command logic
 * @param  {Socket.io Socket} socket    The socket of the client who sent the command
 * @param  {[type]} character           Character of the client sending the request
 * @param  {String} command             the command eg. /say
 * @param  {Object} params              The validated and parsed parameters for the command
 * @param  {Object} cmdObject           The command object template
 * @param  {Game}   Game                The main Game object
 */
function cmdBuy(socket, character, command, params, cmdObject, Game) {
    const npcName = params[0] || null;
    // get the NPC list at the character location
    const NPCs = Game.npcManager.getLocationList(character.location.map, character.location.x, character.location.y);
    let NPC;

    if (!NPCs || !NPCs.length) {
        return Game.eventToSocket(socket, 'error', 'There are no one around with that name.');
    }

    // If no npc name is specified, assume its the first one.
    if (!npcName) {
        NPC = NPCs[0];
    } else {
        NPC = NPCs.find((obj) => obj.name.toLowerCase().indexOf(npcName.toLowerCase()) === 0);
    }

    // if there are no NPC with that name, let them know
    if (!NPC) {
        return Game.eventToSocket(socket, 'error', 'There is no NPC around with that name.');
    }

    // check if the NPC has a "shop" assigned
    if (!NPC.shop) {
        return Game.eventToSocket(socket, 'error', `${NPC.name} the ${NPC.type} is not selling or buying anything.`);
    }

    Game.socketManager.dispatchToSocket(socket, {
        type: SHOP_LOAD,
        payload: NPC.shop.toObject(),
    });
}

module.exports = [
    {
        command: '/shop',
        aliases: [],
        params: [
            {
                name: 'Shop Name',
                desc: 'The name of the shop you wish to access.',
                rules: '',
            },
        ],
        description: 'Access the building\'s shop. If there is only one shop at a location, you can omit the building name.',
        method: cmdShop,
    },
    {
        command: '/trade',
        aliases: [
            '/sell',
            '/buy',
        ],
        params: [
            {
                name: 'NPC Name',
                desc: 'The name of the npc who\'s shop you wish to access.',
                rules: '',
            },
        ],
        description: 'Opens a NPC\'s shop, if one exists.',
        method: cmdBuy,
    },
];
