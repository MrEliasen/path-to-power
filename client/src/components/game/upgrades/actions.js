import {ENHANCEMENT_PURCHASE} from 'shared/actionTypes';
import {socketSend} from '../../app/actions';

export function buyEnhancement(enhId, tier) {
    return socketSend({
        type: ENHANCEMENT_PURCHASE,
        payload: {
            enhId,
            tier,
        },
    });
}
