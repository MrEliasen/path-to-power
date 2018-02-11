// Load required packages
var mongoose = require('mongoose'),
    moment = require('moment');

// Define our product schema
var FactionSchema = new mongoose.Schema({
    faction_id: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        unique: true
    },
    name_lowercase: String,
    tag: {
        type: String,
        unique: true
    },
    tag_lowercase: String,
    leader_id: {
        type: String,
        required: true
    },
    date_added: String,
    date_updated: String
});

// Execute before each user.save() call
FactionSchema.pre('save', function (callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    // set the date for when it was updated
    this.date_updated = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    // create a lower-case version of the name and tag, to make it easier to find.
    this.name_lowercase = this.name.toLowerCase();
    this.tag_lowercase = this.tag.toLowerCase();

    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Faction', FactionSchema);