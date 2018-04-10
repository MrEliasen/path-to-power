import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

const render = (mailOptions) => (
    `<!--
    From: ${mailOptions.from}
    To: ${mailOptions.to}
    Subject: ${mailOptions.subject}
    Send Date: ${new Date().toString()}
-->
${mailOptions.html}`);

/**
 * Sendgrid mailer class
 */
export default class File {
    /**
     * Setup the mailer
     */
    constructor(config) {
        this.config = config;
        this.createOutputDir(config.mail.drivers.file.outputDir);
    }

    /**
     * Create the output directory, recursively, for the emails.
     * @param {String} configPath The output path for the email html files
     */
    createOutputDir(configPath) {
        this.outputPath = path.join(__dirname, '../../../', configPath);
        mkdirp.sync(this.outputPath, {mode: '0755'});
    }

    /**
     * @param {Object} mailOptions The mail options
     */
    sendMail(mailOptions, callback) {
        const fileName = path.join(this.outputPath, new Date().toISOString().replace(/[^0-9Z]+/g, '-')).slice(0, -1);
        fs.writeFile(`${fileName}.html`, render(mailOptions), callback);
    }
}
