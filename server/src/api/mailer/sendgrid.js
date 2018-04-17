/**
 * Sendgrid mailer class
 */
export default class Sendgrid {
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