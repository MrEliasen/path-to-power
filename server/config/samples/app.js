import {env} from '../utils/configure';

export default {
    client_url: env('APP_CLIENT_URL', 'http://localhost:8080'),
    server_port: env('APP_SERVER_PORT', 8086),
};
