import LocalStrategy from 'passport-local';
import AccountModel from '../../models/account';

/**
 * Handle local authentication requests
 * @param  {Function} done
 */
export function setup(passport) {
    //setup the stategies we want
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    }, LocalAuth));
}

/**
 * Setup local authentication
 * @param  {Passport} passport Passport object
 */
function LocalAuth(username, password, done) {
    AccountModel.findOne({username: username}, {username: 1, password: 1}, async (err, user) => {
        if (err) {
            return done(err);
        }

        if (!user) {
            return done(null, false);
        }

        const same = await user.verifyPassword(password);

        if (!same) {
            return done(null, false);
        }

        return done(null, user.toObject());
    });
}
