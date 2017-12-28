// Load required packages
var mongoose = require('mongoose'),
    moment = require('moment'),
    uuid = require('uuid/v4'),
    config = require('../../../../config.json');

// Define our product schema
var AccountSchema = new mongoose.Schema({
    twitch_id: {
        type: String,
        unique: true,
        required: true
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
    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Account', AccountSchema);