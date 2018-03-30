import {newCommand} from '../actions';

export function openNPCShop(NPCName) {
    return newCommand(`/buy "${NPCName}"`);
}
