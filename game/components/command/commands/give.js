export default function cmdGive(socket, command, params, Game) {
    if (!params[0]) {
        return;
    }

    const itemKey = params[0];
    const amount = parseInt(params[1]) || 1;
    const item = Game.itemManager.getTemplate(itemKey);

    if (!item) {
        return Game.eventToSocket(socket, 'error',  'Invalid item.');
    }

    Game.characterManager.get(socket.user.user_id)
        .then((character) => {
            character.giveItem(item, amount);
            Game.eventToSocket(socket, 'info',  `Your received ${amount}x ${item.name}`);
            Game.characterManager.updateClient(socket.user.user_id, 'inventory');
        })
        .catch(() => {
            Game.eventToSocket(socket, 'error',  'Invalid character. Please logout and back in.')
        });
}