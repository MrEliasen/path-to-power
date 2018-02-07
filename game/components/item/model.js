// Load required packages
var mongoose = require('mongoose'),
    moment = require('moment');

// Define our product schema
var ItemSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    item_id: {
        type: String,
        required: true,
    },
    modifiers: {
        type: {},
    },
    equipped_slot: {
        type: String
    },
    date_added: String,
    date_updated: String
});

// Execute before each user.save() call
ItemSchema.pre('save', function (callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    // set the date for when it was updated
    this.date_updated = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    
    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Item', ItemSchema);