var throttle = require('./throttle');

module.exports = function(app, express) {
    // Create our Express v1 router
    var router = express.Router();

    /************************************
     *         API v1 endpoints         *
     ************************************/
    // Load API endpoint controllers
    //var authController  = require(__dirname + '/controllers/authentication');
    var accountController  = require(__dirname + '/controllers/account');

    // Create endpoint handlers for account CRUD
    router.route('/account')
        .post(accountController.signup);

    // Create endpoint handlers for authentication
    router.route('/auth')
        .post(accountController.login);

    // Register all our routes with /api
    app.use('/api/v1', router);

    // initiate the rate limiters
    //throttle.init(app);
};