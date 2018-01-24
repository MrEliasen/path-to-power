export default class SkillHide {
    constructor(value) {
        this.id = 'hide';
        this.base = 10;
        this.value = value || this.base;
    }
}

export default {
    template: new SkillHide();
    new: (skill) => {
        return new SkillHide(skill);
    }
}