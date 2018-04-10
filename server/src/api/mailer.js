/**
 * Sendgrid mailer class
 */
class Sendgrid {
    /**
     * Setup the mailer
     */
    constructor(config) {
        this.sgMail = require('@sendgrid/mail');
        this.sgMail.setApiKey(config.mail.drivers.sendgrid.apikey);
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

    switch (config.mail.driver) {
        case 'sendgrid':
            mailer = new Sendgrid(config);
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
