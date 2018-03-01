// Load required packages
import mongoose from 'mongoose';
import moment from 'moment';

// Define our product schema
const ProviderSchema = new mongoose.Schema({
    accountId: {
        type: String,
        required: true,
    },
    provider: {
        type: String,
        required: true,
    },
    date_added: String,
});

// Execute before each user.save() call
ProviderSchema.pre('save', async function(callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Provider', ProviderSchema);
