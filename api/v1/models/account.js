// Load required packages
var mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs'),
    moment = require('moment'),
    uuid = require('uuid/v4'),
    winston = require('winston'),
    config = require('../../../config.json');

// Define our product schema
var AccountSchema = new mongoose.Schema({
    twitchId: {
        type: String,
        unique: true,
        required: true
    },
    username: {
        type: String,
    },
    display_name: {
        type: String,
    },
    session_token: {
        type: String
    },
    date_added: String,
    date_updated: String
});

async function generateHash(input, rounds) {
    return new Promise(function (resolve, reject) {
        try {
            // Password changed so we need to hash it
            bcrypt.genSalt(rounds, function (err, salt) {
                if (err) {
                    winston.log('error', 'v1/models/account/generateHash genSalt', {
                        err: err,
                        id: uuid()
                    });
                    return reject(err);
                }

                bcrypt.hash(input, salt, null, function (err, hash) {
                    if (err) {
                        winston.log('error', 'v1/models/account/generateHash hash', {
                            err: err,
                            id: uuid()
                        });
                        return reject(err);
                    }

                    resolve(hash);
                });
            });
        }
        catch (err) {
            winston.log('error', 'v1/models/account/generateHash catch', {
                err: err,
                id: uuid()
            });
            reject(err);
        }
    });
}

// Execute before each user.save() call
AccountSchema.pre('save', function (callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format(config.rfc2822);
    }

    if (!this.session_token) {
        // set the date for when it was created
        this.session_token = uuid();
    }

    // set the date for when it was updated
    this.date_updated = moment().format(config.rfc2822);

    setTimeout(async () => {
        // Break out if the password hasn't changed
        if (this.isModified('password')) {
            this.password = await generateHash(this.password, config.password.rounds);
        }

        callback();
    }, 0);
});

AccountSchema.methods.verifyPassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }

        cb(null, isMatch);
    });
};

// Export the Mongoose model
module.exports = mongoose.model('Account', AccountSchema);