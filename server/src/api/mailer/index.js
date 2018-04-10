import Sendgrid from './sendgrid';
import MailToLog from './file';

/**
 * @param {Express App} app The main game app
 * @param {http/s} webServer The webserver
 * @param {Object} config The config
 * @param {Logger} logger The application logger
 */
export default function(config, logger) {
    // setup mailer service
    let mailer;

    switch (config.mail.driver) {
        case 'sendgrid':
            mailer = new Sendgrid(config);
            break;

        case 'file':
            mailer = new MailToLog(config, logger);
            break;

        default:
            mailer = require('nodemailer');
            mailer.createTransport({
                host: config.mail.drivers.smtp.host,
                port: config.mail.drivers.smtp.port,
                auth: {
                    user: config.mail.drivers.smtp.user,
                    pass: config.mail.drivers.smtp.password,
                },
            });
            break;
    }

    return mailer;
};
