/**
 * Sendgrid mailer class
 */
class Sendgrid {
    /**
     * Setup the mailer
     */
    constructor() {
        this.sgMail = require('@sendgrid/mail');
        this.sgMail.setApiKey(process.env.MAILER_PASSWORD);
    }

    /**
     * @param {Object} mailOptions The mail options
     */
    sendMail(mailOptions, callback) {
        this.sgMail.send(mailOptions, callback);
    }
}

/**
 * @param {Express App} app The main game app
 * @param {http/s} webServer The webserver
 * @param {Object} config The config
 */
export default function(config) {
    // setup mailer service
    let mailer;

    switch (config.mailserver.transport) {
        case 'sendgrid':
            mailer = new Sendgrid();
            break;

        default:
            mailer = require('nodemailer');
            mailer.createTransport({
                host: config.mailserver.host,
                port: config.mailserver.port,
                auth: {
                    user: process.env.MAILER_USER,
                    pass: process.env.MAILER_PASSWORD,
                },
            });
            break;
    }

    return mailer;
};
