const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    verified: {
        type: Boolean,
        default: false,
    }


})


const userModel = mongoose.model('user', userSchema);


module.exports = userModel;