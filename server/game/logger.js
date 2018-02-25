import chalk from 'chalk';
import fs from 'fs';

/*
class Logger {
    constructor() {
        this.render = ({ title, out = console.log, color = chalk.reset }) => (...args) => {
            const shortStack = e =>
                e instanceof Error
                    ? e.stack
                            .split('\n')
                            .slice(0, 2)
                            .join('\n')
                    : e;

            const log = compose(out, color, shortStack);
            const group = args.length > 1;
            const file = () => {
                const entry = new Error().stack.split('\n')[1];
                return entry ? (entry.match(/([^\\/]+)\)/) || [])[1] : '';
            };

            if (args.length > 1) {
                if (group) console.group(color(title), file());
                args.forEach(log);
                if (group) console.groupEnd();
            } else {
                out(color(title), file());
            }
        };

        this.log = this.render({ title: 'LOG:' });
        this.warn = this.render({ title: 'WARN:', log: console.warn, color: chalk.yellow });
        this.error = this.render({ title: 'ERR:', log: console.error, color: chalk.red });
    }
}
*/

class Logger {
    constructor(config) {
        this.config = config;
        this.levels = [
            'error',
            'warn',
            'info',
            'debug',
        ];

        this.config.level = this.levels.indexOf(this.config.level);
    }

    info() {
        this.log('info', null, ...arguments);
    }

    error() {
        this.log('error', chalk.red, ...arguments);
    }

    warn() {
        this.log('warn', chalk.yellow, ...arguments);
    }

    debug() {
        this.log('debug', chalk.blue, ...arguments);
    }

    log(level, colour) {
        if (this.config.level < this.levels.findIndex(level)) {
            return;
        }

        Array.from(arguments).slice(2).forEach((arg) => {
            if (this.config.toConsole) {
                colour = colour || function(str) {
                    return str;
                };
                console.log(colour(`[${level}] `), arg);
            }

            fs.appendFileSync(this.config[level].file || __dirname + '/info.log', `[${level}] ${arg}\n`);
        });
    }
}

export default Logger;
