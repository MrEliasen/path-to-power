import { clientCommandError } from '../redux/actions';
import { updateClientCharacter, updateCharacter } from '../../character/redux/actions';
import { newEvent } from '../../socket/redux/actions';
import { checkCommandAtLocation } from '../index';

export default function cmdHeal(socket, params, getState, command, resolve) {
    let healAmount = parseInt(params[0]);
    const meta = {
        socket_id: socket.id
    }

    // Check if the healAmount is valid
    if (!healAmount || healAmount < 1) {
        return resolve([{
            ...clientCommandError('Invalid heal amount. Syntax: /heal <amount>'),
            meta
        }]);
    }

    checkCommandAtLocation(socket, getState, command, (error, character, location, actionModifiers) => {
        if (error) {
            return resolve(error);
        }

        // Check if full health
        if (character.stats.health === character.stats.health_max) {
            return resolve([{
                ...clientCommandError('You are already at full health!'),
                meta
            }]);
        }

        // Check if the heal would exceed 100%, if so, cap it.
        if ((character.stats.health + healAmount) > character.stats.health_max) {
            healAmount = character.stats.health_max - character.stats.health;
        }

        // Check if they have the money
        const price = healAmount * actionModifiers.cost;
        if (actionModifiers.cost && price > character.stats.money) {
            return resolve([{
                ...clientCommandError('You do not have enough money to heal that amount.'),
                meta
            }]);
        }

        // remove money and add health
        character.stats.money = character.stats.money - price;
        character.stats.health = character.stats.health + healAmount;

        return resolve([
            updateCharacter(character),
            {
                ...newEvent(`You healed ${healAmount}, costing you ${price}`),
                meta,
            },
            {
                ...updateClientCharacter(character),
                meta
            }
        ])
    })
}