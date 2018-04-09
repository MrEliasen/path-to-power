import chalk from 'chalk';
import ConsoleLogger from './console';
import FileLogger from './file';

/**
 * https://gist.github.com/etalisoft/81280a2a1a312ca6aab91daa909ccba0
 */
class Logger {
    /**
     * class constructor
     */
    constructor(config) {
        const levels = [
            'debug',
            'info',
            'warn',
            'error',
        ];
        const level = levels.indexOf(config.level);

        const consoleDebug = new ConsoleLogger({groupName: 'DEBUG:', method: 'debug', color: chalk.blue}, levels.indexOf('debug'), level);
        const consoleInfo = new ConsoleLogger({groupName: 'LOG:', method: 'info', color: chalk.reset}, levels.indexOf('info'), level);
        const consoleWarn = new ConsoleLogger({groupName: 'WARN:', method: 'warn', color: chalk.yellow}, levels.indexOf('warn'), level);
        const consoleError = new ConsoleLogger({groupName: 'ERROR:', method: 'error', color: chalk.red}, levels.indexOf('error'), level);

        const fileDebug = new FileLogger({groupName: 'DEBUG:', file: config.debugFile}, levels.indexOf('debug'), level);
        const fileInfo = new FileLogger({groupName: 'INFO:', file: config.infoFile}, levels.indexOf('info'), level);
        const fileWarn = new FileLogger({groupName: 'WARN:', file: config.warnFile}, levels.indexOf('warn'), level);
        const fileError = new FileLogger({groupName: 'ERROR:', file: config.errorFile}, levels.indexOf('error'), level);

        this.actions = {consoleInfo, consoleDebug, consoleWarn, consoleError, fileInfo, fileDebug, fileWarn, fileError};

        this.debug = run(consoleDebug, fileDebug);
        this.info = run(consoleInfo, fileInfo);
        this.warn = run(consoleWarn, fileWarn);
        this.error = run(consoleError, fileError);
        this.custom = run;

        /**
         * parse the args
         * @param  {Args Array} args
         * @return {Object}
         */
        function parse(...args) {
            // NOTE: Node doesn't supply Error.fileName and Error.lineNumber
            // So we have to try to dig it out of the current stacktrace
            const stackFrame = new Error().stack.split('\n')[3] || '';
            const regFile = /\((.+):(\d+):(\d+)\)/;
            const [, fileName, line, column] = stackFrame.match(regFile) || [];

            return {args, fileName, line, column};
        }

        /**
         * Do the actual logging
         * @param  {Array} actions
         */
        function run(...actions) {
            return (...args) => {
                const data = parse(...args);
                return Promise.all(actions.map((action) => action.log(data)));
            };
        }
    }
}

export default Logger;
