const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'officer', 'admin', 'professor', 'guest'],
        default: 'guest'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);