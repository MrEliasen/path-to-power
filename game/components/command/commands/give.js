export default function cmdGive(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    const itemKey = params[0];
    const amount = parseInt(params[1]) || 1;
    const itemTemplate = Game.itemManager.getTemplate(itemKey);

    if (!itemTemplate) {
        return Game.eventToSocket(socket, 'error',  'Invalid item.');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            const item = Game.itemManager.add(itemTemplate.id);
            character.giveItem(item, amount);
            Game.eventToSocket(socket, 'info',  `Your received ${amount}x ${item.name}`);
            Game.characterManager.updateClient(socket.user.user_id, 'inventory');
        })
        .catch((error) => {
            Game.eventToSocket(socket, 'error',  'Invalid character. Please logout and back in.')
        });
}