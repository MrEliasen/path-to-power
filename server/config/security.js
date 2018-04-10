import {env} from '../utils/configure';

export default {
    signingSecret: env('SECURITY_SIGNING_SECRET', ''),
    password: {
        rounds: env('SECURITY_PASSWORD_ROUNDS', 11),
        minlen: env('SECURITY_PASSWORD_MINLEN', 8),
    },
    certificate: {
        cert: env('SECURITY_CERTIFICATE_CERT', ''),
        key: env('SECURITY_CERTIFICATE_KEY', ''),
        ca: env('SECURITY_CERTIFICATE_CA', ''),
    },
};
