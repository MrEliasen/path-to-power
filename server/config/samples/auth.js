import {env} from '../utils/configure';

export default {
    providers: [
        {
            id: env('AUTH_LOCAL_ID', 'local'),
            package: env('AUTH_LOCAL_PACKAGE', 'local'),
            enabled: env('AUTH_LOCAL_ENABLED', true),
            activation_link: env('AUTH_LOCAL_ACTIVATION_LINK', true),
        },
        {
            id: env('AUTH_xxxxx_ID', 'passport-strategy-name'),
            package: env('AUTH_xxxxx_PACKAGE', '<passport-strategy-package-name>'),
            enabled: env('AUTH_xxxxx_ENABLED', false),
            clientID: env('AUTH_xxxxx_CLIENT_ID', ''),
            clientSecret: env('AUTH_xxxxx_CLIENT_SECRET', ''),
            name: env('AUTH_xxxxx_NAME', 'Template'),
            scope: env('AUTH_xxxxx_SCOPE', [], ','),
        },
    ],
};
