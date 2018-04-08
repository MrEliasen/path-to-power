import React from 'react';

class GridDetails {
    constructor(event, itemList) {
        this.event = event;
        this.itemList = itemList;
    }

    parse() {
        const events = [];

        events.push({
            message: <strong>Location:</strong>,
        });
        events.push({
            message: `N${this.event.location.y} E${this.event.location.x}`,
        });

        if (this.event.players.length) {
            let playerlist = [];
            events.push({
                message: <strong>Players:</strong>,
            });

            this.event.players.forEach((player) => {
                playerlist.push(player.name);
            });

            events.push({
                message: playerlist.join(', '),
            });
        }

        if (this.event.npcs.length) {
            let npclist = [];
            events.push({
                message: <strong>NPCs:</strong>,
            });

            this.event.npcs.forEach((npc) => {
                npclist.push(`${npc.name} the ${npc.type}`);
            });

            events.push({
                message: npclist.join(', '),
            });
        }

        if (this.event.items.length) {
            let items = [];
            events.push({
                message: <strong>Items:</strong>,
            });

            this.event.items.forEach((item) => {
                const itemObj = this.itemList[item.id];
                items.push(`${(itemObj.stats.stackable ? `(${item.durability}) ` : '')}${itemObj.name}`);
            });

            events.push({
                message: items.join(', '),
            });
        }

        return events;
    }
}

export default GridDetails;
