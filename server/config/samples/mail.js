import {env} from '../utils/configure';

export default {
    driver: env('MAIL_DRIVER', 'log'),
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
        log: {
            path: env('MAIL_DRIVER_LOG_PATH', '/logs/mail.log'),
        },
    },
    sender: env('MAIL_SENDER', 'sender@domain.tld'),
};
