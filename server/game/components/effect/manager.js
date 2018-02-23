import * as Effects from './effects';

/**
 * The Effect manager
 */
export default class EffectManager {
    /**
     * Class constructor
     * @param  {Game} Game The main Game object
     */
    constructor(Game) {
        this.Game = Game;

        Game.logger.info('EffectManager::constructor LOADED');
    }

    /**
     * Applies and effect and returns the result.
     * @param  {Character} character        The character executing the effect
     * @param  {String}    effectId         The effect ID
     * @param  {Object}    effectModifiers  Additional modifiers to overwrite the defaults
     * @return {Mixed}                      Anything returned from the effect
     */
    apply(character, effectId, effectModifiers = {}, item = null) {
        return new Promise(async (resolve, reject) => {
            const effect = Effects[effectId];

            if (!effect) {
                this.Game.logger.error(`The effect ID ${effectId}, did not match any effects.`);
                return reject();
            }

            await effect(character, effectModifiers || {}, item, this.Game)
                .then((output) => {
                    resolve(output);
                })
                .catch((err) => {
                    this.Game.logger.error(err.message);
                    reject(err);
                });
        });
    }
}
