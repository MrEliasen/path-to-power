export default class SkillSnoop {
    constructor(Game, modifiers) {
        this.Game = Game;
        this.id = 'snoop';
        this.name = 'Snooping';
        this.command = '/snoop';
        this.value = 1;
        this.improve = true;
        this.cooldown = 20;

        Object.assign(this, {...modifiers});
    }

    /**
     * Get the skill's modifieres
     * @return {[type]} [description]
     */
    getModifiers() {
        return {
            value: this.value
        };
    }

    /**
     * Get information on the target character, based on skill level
     * @param  {Character} targetCharacter Target character
     * @return {Object}                    Information from the target character
     */
    use(targetCharacter) {
        this.train();

        // TODO: have a chance to get more information than the tier allows
        // rank 1 details, will be expanded on if they have the rank
        const details = {
            name: targetCharacter.name,
            location: {
                map: targetCharacter.location.map,
            }
        }

        // if they have rank 2 or higher
        if (this.value >= 2) {
            Object.assign(details, {
                equipped: {
                    ...targetCharacter.equipped
                },
                rank: Game.characterManager.getRank(targetCharacter.stats.exp)
            })
        }

        // if they have rank 3 or higher
        if (this.value >= 3) {
            Object.assign(details, {
                location: {
                    map: targetCharacter.location.map,
                    x: targetCharacter.location.x
                },
                skills: {
                    ...targetCharacter.exportSkills(true)
                },
                stats: {
                    health: targetCharacter.stats.health
                }
            })
        }

        // if they have rank 4 or higher
        if (this.value >= 4) {
            Object.assign(details, {
                location: {
                    map: targetCharacter.location.map,
                    x: targetCharacter.location.x,
                    y: targetCharacter.location.y
                },
                abilities: {
                    ...targetCharacter.exportAbilities(true)
                },
                stats: {
                    health: targetCharacter.stats.health,
                    money: targetCharacter.stats.money,
                    bank: targetCharacter.stats.bank
                }
            })
        }

        return details;
    }

    /**
     * Increase the skill by the training amount
     */
    train() {
        if (!this.improve) {
            return;
        }

        // this is how much the skill should increment when used.
        // Round the new value to 5 decimal points
        this.value = this.value + Math.round(
            Math.round(
                (0.015 / this.value) * 100000
            )
        ) / 100000;
    }
}