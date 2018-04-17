import {env} from 'utils/configure';

export default {
    url: env('API_URL', 'http://localhost'),
    port: env('API_PORT', 8087),
};
