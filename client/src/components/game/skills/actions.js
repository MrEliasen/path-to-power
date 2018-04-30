import {SKILL_PURCHASE} from 'shared/actionTypes';
import {socketSend} from '../../app/actions';

export function buySkill(skillId, tier) {
    return socketSend({
        type: SKILL_PURCHASE,
        payload: {
            skillId,
            tier,
        },
    });
}
