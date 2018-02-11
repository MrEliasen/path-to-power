export default class Skill_Template {
    constructor(Game, modifiers) {
        this.Game = Game;
        this.id = '_template'; // (REQUIRED) The unique id for this skill
        this.name = 'Template'; // (REQUIRED) The name of the skill (visible to players)
        this.command = '/templateskill'; // (OPTIONAL) The /command they player needs to type to use the skill

        // (REQUIRED)
        Object.assign(this, {...modifiers});
    }

    /**
     * (REQUIRED) Get the skill's modifieres, used for sending to client or saving in the DB
     * @return {Object}
     */
    getModifiers() {
        return {
            value: this.value
        };
    }

    /**
     * (OPTIONAL) The skill's functionality, how executed however else you want
     */
    use() {
        this.train();

        // You skill code here
    }

    /**
     * (OPTIONAL) Increase the skill by the training amount, not needed, you can do what you want
     */
    train() {
        // this is how much the skill should increment when used.
        // Round the new value to 5 decimal points
        this.value = Math.round(
            Math.round(
                (0.015 / this.value) * 100000
            )
        ) / 100000;
    }
}