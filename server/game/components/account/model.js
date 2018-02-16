// Load required packages
import mongoose from 'mongoose';
import moment from 'moment';
import uuid from 'uuid/v4';

// Define our product schema
const AccountSchema = new mongoose.Schema({
    twitch_id: {
        type: String,
        unique: true,
        required: true,
    },
    display_name: {
        type: String,
    },
    session_token: {
        type: String,
    },
    date_added: String,
    date_updated: String,
});

// Execute before each user.save() call
AccountSchema.pre('save', function(callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    if (!this.session_token) {
        // set the date for when it was created
        this.session_token = uuid();
    }

    // set the date for when it was updated
    this.date_updated = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Account', AccountSchema);
