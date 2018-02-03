/**
 * Generates a random value between min and max
 * @param  {Number} min
 * @param  {Number} max 
 * @return {Number}
 */
export function dice(min = 0, max) {
    return Math.floor(
        (Math.random() * (
            Math.max(min, max) - Math.min(min, max)
        )) + Math.min(min, max)
    );
}