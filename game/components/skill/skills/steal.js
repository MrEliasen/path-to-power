export default class SkillSteal {
    constructor(value) {
        this.id = 'steal';
        this.base = 10;
        this.value = value || this.base;
    }
}

export default {
    template: new SkillSteal();
    new: (skill) => {
        return new SkillSteal(skill);
    }
}