import {env} from 'utils/configure';

export default {
    clientUrl: env('APP_CLIENT_URL', 'http://localhost:8080'),
    serverPort: env('APP_SERVER_PORT', 8086),
};
