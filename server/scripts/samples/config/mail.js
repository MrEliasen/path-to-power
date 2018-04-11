import {env} from 'utils/configure';

export default {
    driver: env('MAIL_DRIVER', 'file'),
    drivers: {
        smtp: {
            host: env('MAIL_DRIVER_HOST', 'smtp.mailserver.tld'),
            user: env('MAIL_DRIVER_USER', ''),
            password: env('MAIL_DRIVER_PASSWORD', ''),
            port: env('MAIL_DRIVER_PORT', 587),
        },
        sendgrid: {
            user: env('MAIL_DRIVER_USER', ''),
            apikey: env('MAIL_DRIVER_PASSWORD', ''),
        },
        file: {
            outputDir: env('MAIL_DRIVER_FILE_PATH', '/logs/mail'),
        },
    },
    sender: env('MAIL_SENDER', 'sender@domain.tld'),
};
