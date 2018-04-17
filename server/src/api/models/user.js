// Load required packages
import mongoose from 'mongoose';
import moment from 'moment';
import uuid from 'uuid/v4';
import bcrypt from 'bcrypt';
import config from 'config/security';

// Define our product schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    newEmail: {
        type: String,
    },
    password: {
        type: String,
    },
    activated: {
        type: Boolean,
        default: false,
    },
    activationToken: {
        type: String,
    },
    session_token: {
        type: String,
    },
    passwordReset: {
        type: {},
    },
    date_added: String,
    date_updated: String,
});

// Execute before each user.save() call
UserSchema.pre('save', async function(callback) {
    // set the date for when it was updated
    this.date_updated = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');

    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    if (!this.session_token) {
        // set the date for when it was created
        this.session_token = uuid();
    }

    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, config.password.rounds);
    }
    callback();
});

UserSchema.methods.verifyPassword = function(string) {
    return bcrypt.compare(string, this.password);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
