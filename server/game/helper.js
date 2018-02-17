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
    return string.charAt(0).toUpperCase() + string.substr(1, string.length);
}

/**
 * Find objects matching the search string. Will do direct comparison first.
 * @param  {Array}  list            The list of objects to search in
 * @param  {String} compareProperty The property of an object within the array to compare with
 * @param  {[type]} searchString    The search string
 * @return {Mixed}                  Returns the matchinf object or undefined
 */
export function findInArray(list, compareProperty = 'name', searchString) {
    searchString = searchString.toLowerCase();
    // direct search for objects matching the searchString
    let found = list.find((obj) => obj[compareProperty].toLowerCase() === searchString);

    // search objects matching the beginning of string
    if (!found) {
        found = list.find((obj) => obj[compareProperty].toLowerCase().indexOf(searchString));
    }

    return found;
}
