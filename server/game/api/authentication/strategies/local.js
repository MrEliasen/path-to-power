import LocalStrategy from 'passport-local';

/**
 * Handle local authentication requests
 * @param  {Function} done
 */
export function init(passport, routes) {
    //setup the stategies we want
    passport.use(new LocalStrategy({
        session: false,
    }, setupLocalAuth));

    routes.route('/auth/local')
        .post(passport.authenticate('local'), authenticated);
}

/**
 * Setup local authentication
 * @param  {Passport} passport Passport object
 */
function setupLocalAuth(username, password, done) {
    User.findOne({username: username}, function(err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false);
        }

        if (!user.verifyPassword(password)) {
            return done(null, false);
        }

        return done(null, user);
    });
}

/**
 * Handles successful authentication attempts
 * @param  {Express Request} req
 * @param  {Express Response} res
 */
function authenticated(req, res) {
    // create JWT
    // send JWT back to client
    console.log(req.user);
}
