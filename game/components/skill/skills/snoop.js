export default class SkillSnoop {
    constructor(modifiers) {
        this.id = 'snoop';
        this.name = 'Snooping';
        this.value = 10;

        Object.assign(this, {...modifiers});
    }

    getModifiers() {
        return {
            value: this.value
        };
    }
}