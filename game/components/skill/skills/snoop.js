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
        // This would make it a bit more interesting and useful when leveling.
        switch(true) {
            case (this.value >= 4):
                return {
                    name: targetCharacter.name,
                    location: {
                        map: targetCharacter.location.map,
                        x: targetCharacter.location.x,
                        y: targetCharacter.location.y
                    },
                    equipped: {
                        ...targetCharacter.equipped
                    },
                    skills: {
                        ...targetCharacter.exportSkills(true)
                    },
                    abilities: {
                        ...targetCharacter.exportAbilities(true)
                    },
                    stats: {
                        health: targetCharacter.stats.health,
                        money: targetCharacter.stats.money,
                    }
                }
                break;

            case (this.value >= 3):
                return {
                    name: targetCharacter.name,
                    location: {
                        map: targetCharacter.location.map,
                        x: targetCharacter.location.x
                    },
                    equipped: {
                        ...targetCharacter.equipped
                    },
                    skills: {
                        ...targetCharacter.skills
                    },
                    stats: {
                        health: targetCharacter.stats.health
                    }
                }
                break;

            case (this.value >= 2):
                return {
                    name: targetCharacter.name,
                    location: {
                        map: targetCharacter.location.map,
                    },
                    equipped: {
                        ...targetCharacter.equipped
                    }
                }
                break;

            case (this.value >= 1):
                return {
                    name: targetCharacter.name,
                    location: {
                        map: targetCharacter.location.map,
                    }
                }
                break;
        }
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