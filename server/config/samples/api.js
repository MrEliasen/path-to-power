import {env} from '../utils/configurator';

export default {
    url: env('API_URL', 'http://localhost'),
    port: env('API_PORT', 8087),
};
