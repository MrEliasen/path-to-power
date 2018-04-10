import fs from 'fs';

/**
 * Checks a given config value has an overwrite from .env
 * @param  {String}        key          The .env option key
 * @param  {String|Number} defaultValue Default value to use.
 * @param  {String}        split        if the value should be converted to array, use this delimiter.
 * @return {String|Number}              The resulting config value
 */
export function env(key, defaultValue, split = null) {
    if (typeof process.env[key] !== 'undefined' && process.env[key] !== '') {
        return process.env[key];
    }

    return defaultValue;
}

/**
 * Loads all config files and compiles them into one object
 * @return {Object}
 */
export function generate() {
    const configDir = `${__dirname}/../config`;
    const config = {};

    fs.readdirSync(configDir).forEach((file) => {
        if (file === 'samples') {
            return;
        }

        if (file[0] === '.') {
            return;
        }

        const configData = require(`${configDir}/${file}`);
        config[file.toLowerCase().replace('.js', '')] = configData.default;
    });


    return config;
}
