/**
 * Generates a random value between min and max
 * @param  {Number} min
 * @param  {Number} max
 * @return {Number}
 */
export function dice(min, max) {
    if (isNaN(parseInt(min)) || isNaN(parseInt(max))) {
        return 0;
    }

    const result = Math.floor(
        (Math.random() * (
            Math.max(min, max) - Math.min(min, max)
        )) + Math.min(min, max)
    );

    return result;
}

/**
 * Takes a full, deep-copy, of a given object
 * @param {Object} toCopy Object to copy
 * @return {Object}
 */
export function deepCopyObject(toCopy) {
    return JSON.parse(JSON.stringify(toCopy));
}

/**
 * Uppercases the first letter in a string
 * @param {String} string
 * @return {String}
 */
export function ucfirst(string) {
    string = '' + string;
    return string.charAt(0).toUpperCase() + string.substr(1, string.length);
}

/**
 * Find objects matching the search string. Will do direct comparison first.
 * @param  {Array}  list            The list of objects to search in
 * @param  {String} compareProperty The property of an object within the array to compare with
 * @param  {[type]} searchString    The search string
 * @return {Mixed}                  Returns the matchinf object or undefined
 */
export function findObjectInArray(list, compareProperty = 'name', searchString) {
    if (searchString === null || searchString === undefined) {
        return undefined;
    }

    return [...list].sort((a, b) => {
        if (a[compareProperty] < b[compareProperty]) {
            return -1;
        }

        if (a[compareProperty] > b[compareProperty]) {
            return 1;
        }

        return 0;
    }).find((obj) => {
        if (typeof obj[compareProperty] !== 'string') {
            return false;
        }

        return obj[compareProperty].toLowerCase().indexOf(searchString) === 0;
    });
}
