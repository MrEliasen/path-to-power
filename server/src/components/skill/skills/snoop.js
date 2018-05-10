
/**
 * Snoop skill logic
 */
export default class SkillSnoop {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'snoop';
        this.name = 'Snooping';
        this.description = 'Gather information about a target player. The higher your skill level the more information.';
        this.value = 0;

        Object.assign(this, {...modifiers});
    }

    /**
     * Get the skill's modifieres
     * @return {[type]} [description]
     */
    getModifiers() {
        return {
            value: this.value,
        };
    }

    /**
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                expCost: 1000,
                description: 'Know the target\'s city.',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Know the target\'s city and which items a target has equipped.',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Know the target\'s city, equipped items, health and North coordinate.',
            },
            {
                tier: 4,
                expCost: 10000,
                description: 'Know the target\'s city, equipped items, health, abilities, and location coordinate.',
            },
        ];
    }

    /**
     * Get information on the target character, based on skill level
     * @param  {Character} targetCharacter Target character
     * @return {Object}                    Information from the target character
     */
    use(targetCharacter) {
        const gameMap = this.Game.mapManager.get(targetCharacter.location.map);
        let messages;

        // rank 1 details, will be expanded on if they have the rank
        if (this.value >= 1) {
            messages = {
                location: [
                    `   Map: ${gameMap.name}`
                ],
            };
        }

        // if they have rank 2 or higher
        if (this.value >= 2) {
            messages.equipment = [];

            const armor = targetCharacter.getEquipped('armour-body');
            if (armor) {
                messages.equipment.push(`   Armor: ${armor.name}`)
            }

            const ranged = targetCharacter.getEquipped('weapon-ranged');
            if (ranged) {
                messages.equipment.push(`   Weapon (ranged): ${ranged.name}`)
            }

            const melee = targetCharacter.getEquipped('weapon-melee');
            if (melee) {
                messages.equipment.push(`   Weapon (melee): ${melee.name}`)
            }

            const ammo = targetCharacter.getEquipped('weapon-ammo');
            if (ammo) {
                messages.equipment.push(`   Ammo: ${ammo.name}`)
            }
        }

        // if they have rank 3 or higher
        if (this.value >= 3) {
            messages.location.push(`   N: ${targetCharacter.location.y}`);
            messages.stats = [
                `   Health: ${targetCharacter.stats.health}`
            ];
        }

        // if they have rank 4 or higher
        if (this.value >= 4) {
            messages.location.push(`   E: ${targetCharacter.location.x}`);
            messages.abilities = targetCharacter.abilities.map((ability) => `    ${ability.name}: ${ability.value}`);
        }

        return Object.keys(messages).reduce((accumilator, key) => {
            accumilator.push(key.toUpperCase());
            return accumilator.concat(messages[key]);
        }, []);
    }
}
