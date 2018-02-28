import helmet from 'helmet';
import bodyParser from 'body-parser';
import contentFilter from 'content-filter';

// API Route/enpoint controllers
import {setup as authSetup} from './authentication';

/**
 * Setup the API endpoints
 * @param  {HTTP/S}  webserver The HTTP/s webserver
 * @param  {Express} app       Express app
 */
export default function(app) {
    app.use(bodyParser.json());
    app.use(helmet());
    app.use(bodyParser.urlencoded({
      extended: true,
    }));
    app.use(contentFilter({
        methodList: ['GET', 'POST'],
    }));

    // Set needed headers for the application.
    app.use(function(req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'Accept, X-Requested-With, Content-Type');
        // Whether requests needs to include cookies in the requests sent to the API. We shouldn't use this unless we retained sessions etc. which we don't!
        res.setHeader('Access-Control-Allow-Credentials', false);
        // Pass to next middleware
        next();
    });

    // setup all authentication stategies
    authSetup(app);

    // listen on port 80
    app.listen(8081);
    console.log('API listening on port 8081');
};
