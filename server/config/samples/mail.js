import {env} from '../utils/configure';

export default {
    driver: env('MAIL_DRIVER', 'log'),
    drivers: {
        smtp: {
            host: env('MAIL_DRIVER_HOST', 'smtp.mailserver.tld'),
            user: env('MAIL_DRIVER_USER', ''),
            password: env('MAIL_DRIVER_PASSWORD', ''),
            port: env('MAIL_DRIVER_PORT', 587),
            sender: env('MAIL_DRIVER_SENDER', 'sender@domain.tld'),
        },
        sendgrid: {
            user: env('MAIL_DRIVER_USER', ''),
            apiKey: env('MAIL_DRIVER_PASSWORD', ''),
            sender: env('MAIL_DRIVER_SENDER', 'sender@domain.tld'),
        },
        log: {
            path: env('MAIL_DRIVER_LOG_PATH', '/logs/mail.log'),
        },
    },
};
