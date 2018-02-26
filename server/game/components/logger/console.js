import chalk from 'chalk';

/**
 * https://gist.github.com/etalisoft/81280a2a1a312ca6aab91daa909ccba0
 */
class Console {
    /**
     * Class constructor
     * @param  {Object} config Logger configuration
     */
    constructor(config, loggerLevel, logLevel) {
        this.logLevel = logLevel;
        this.loggerLevel = loggerLevel;
        this.groupName = config.groupName || 'LOG:';
        this.method = config.method || 'log';
        this.color = config.color || chalk.reset;
        this.maxStackFrames = config.maxStackFrames || 3;
        this.maxPathLength = config.maxPathLength || 20;
    }

    /**
     * Logs the args.
     * @param  {[type]} options.args     [description]
     * @param  {[type]} options.fileName [description]
     * @param  {[type]} options.line     [description]
     * @param  {[type]} options.column   [description]
     * @return {[type]}                  [description]
     */
    log({args, fileName, line, column}) {
        return new Promise((resolve) => {
            if (this.loggerLevel < this.logLevel) {
                return resolve();
            }

            const {groupName, method, color, maxStackFrames, maxPathLength} = this;
            let path = fileName ? `${fileName}:${line}:${column}` : '';

            if (path.length > maxPathLength) {
                path = `…${path.slice(-maxPathLength)}`;
            }

            if (args.length > 1 || args[0] instanceof Error) {
                console.group(color(groupName), chalk.gray(path));
                const format = (e) =>
                    e instanceof Error
                        ? e.stack
                                .split('\n')
                                .slice(0, maxStackFrames)
                                .join('\n')
                        : e;
                args.forEach((arg) => console[method](format(arg)));
                console.groupEnd();
            } else {
                console[method](color(args), chalk.gray(path));
            }

            resolve();
        });
    }
}

export default Console;
