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

export function getStringColour(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

/**
 * Fetch a local storage value, if any, and if not expired.
 * @param  {String} key The key of the local strorage value
 * @return {Object|String|Number} The stored data for that key
 */
export function cacheGet(key) {
    try {
        let cache = window.localStorage.getItem(key);

        if (!cache) {
            throw new Error('Not found.');
        }

        cache = JSON.parse(cache);

        if (cache.expire && cache.expire < new Date().getTime() / 1000) {
            throw new Error('Cache expired.');
        }

        return cache.data;
    } catch (err) {
        return null;
    }
}

/**
 * Cache data to local storage. Expiry optional
 * @param  {String} key    The key to store the data under
 * @param  {Mixed}  data   The data to store
 * @param  {Number} expire (Optional) how long the cache should remain valid (seconds)
 */
export function cacheSet(key, data, expire = null) {
    let storeValue = {
        expire: expire ? ((new Date().getTime() / 1000) + expire) : null,
        data,
    };

    window.localStorage.setItem(key, JSON.stringify(storeValue));
}
