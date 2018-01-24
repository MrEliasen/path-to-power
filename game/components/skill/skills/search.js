class SkillSearch {
    constructor(value) {
        this.id = 'search';
        this.base = 10;
        this.value = value || this.base;
    }
}

export default {
    template: new SkillSearch();
    new: (skill) => {
        return new SkillSearch(skill);
    }
}