require('babel-core/register');
require('babel-polyfill');

import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs';
import Logger from '../src/components/logger';

const rootPath = path.join(__dirname, '..');
const logger = new Logger({
    level: 'info',
    debugFile: `${rootPath}/logs/debug.log`,
    infoFile: `${rootPath}/logs/info.log`,
    warnFile: `${rootPath}/logs/warn.log`,
    errorFile: `${rootPath}/logs/error.log`,
});

// Setup .env file is not found
if (!fs.existsSync(`${rootPath}/.env`)) {
    logger.warn('Missing .env file, generating..');
    execSync(`cp -n ${rootPath}/scripts/samples/.env.sample ${rootPath}/.env`);
} else {
    logger.info('.env file found, skipping..');
}

// check if the config directory is setup
logger.info('Generating any missing config files, if found');
if (!fs.existsSync(`${rootPath}/config`)) {
    fs.mkdirSync(`${rootPath}/config`);
}

try {
    execSync(`cp -Rn ${rootPath}/scripts/samples/config/* ${rootPath}/config`);
} catch (err) {
    logger.error(err);
}
