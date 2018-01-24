export default class SkillSnoop {
    constructor(Game, modifiers) {
        this.Game = Game;
        this.id = 'snoop';
        this.name = 'Snooping';
        this.command = '/snoop';
        this.value = 10;

        Object.assign(this, {...modifiers});
    }

    getModifiers() {
        return {
            value: this.value
        };
    }

    use() {
        
    }
}