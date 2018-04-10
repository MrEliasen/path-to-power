import {env} from '../utils/configure';

export default {
    driver: env('DATABASE_DRIVER', 'mongodb'),
    drivers: {
        mongodb: {
            host: env('DATABASE_HOST', 'mongodb://localhost:27017/ptp'),
        },
    },
};
