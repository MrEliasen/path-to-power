import Character from '../character';

class NPC extends Character {
    constructor(characterData) {
        Object.keys(characterData).map((k) => {
            this[k] = characterData[k];
        });
    }
}

export default Character;