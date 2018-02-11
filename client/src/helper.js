export function dice(min = 0, max) {
    return Math.floor(
        (Math.random() * (
            Math.max(min, max) - Math.min(min, max)
        )) + Math.min(min, max)
    );
}

export function getRandomColour() {
    let colour = [];

    colour.push(dice(0, 359));
    colour.push('100%');
    colour.push('45%');

    return {
        color: `hsl(${colour.join(',')})`,
    };
}
