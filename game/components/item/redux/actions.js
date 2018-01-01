import { CLIENT_DROP_ITEM, SERVER_DROP_ITEM } from './types';
import { SERVER_TO_CLIENT } from '../../socket/redux/types';

export function dropItem(item) {
    return {
        type: CLIENT_DROP_ITEM,
        subtype: SERVER_TO_CLIENT,
        payload: item
    }
}

export function serverRecordItemDrop(iteminfo) {
    return {
        type: SERVER_DROP_ITEM,
        payload: iteminfo
    }
}