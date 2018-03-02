// Load required packages
import mongoose from 'mongoose';
import moment from 'moment';

// Define our product schema
const CharacterSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    name_lowercase: {
        type: String,
    },
    location: {
        type: {},
    },
    stats: {
        type: {},
    },
    abilities: {
        type: {},
    },
    skills: {
        type: {},
    },
    faction_id: {
        type: String,
    },
    date_added: String,
    date_updated: String,
});

// Execute before each user.save() call
CharacterSchema.pre('save', function(callback) {
    if (!this.date_added) {
        // set the date for when it was created
        this.date_added = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');
    }

    // set the date for when it was updated
    this.date_updated = moment().format('ddd, D MMM YYYY H:mm:ss [GMT]');

    if (this.name) {
        this.name_lowercase = this.name.toLowerCase();
    }

    callback();
});

// Export the Mongoose model
module.exports = mongoose.model('Character', CharacterSchema);
