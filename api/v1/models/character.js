// Load required packages
var mongoose = require('mongoose'),
    config = require('../../../config.json'),
    moment = require('moment');

// Define our product schema
var CharacterSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: Array // [x,y,mapName]
    },
    health_max: {
        type: Number,
        required: true
    },
    money: Number,
    health: Number,
    date_added: String,
    date_updated: String
});

// Execute before each user.save() call
CharacterSchema.pre('save', function (callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format(config.rfc2822);
    }

    // set the date for when it was updated
    this.date_updated = moment().format(config.rfc2822);
    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Character', CharacterSchema);