// Load required packages
import mongoose from 'mongoose';
import moment from 'moment';

// Define our product schema
const IdentitySchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
    },
    providerId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
    },
    date_added: String,
});

// Execute before each user.save() call
IdentitySchema.pre('save', function(callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Identities', IdentitySchema);
