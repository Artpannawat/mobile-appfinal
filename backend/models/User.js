const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // _id is added by default by Mongoose as ObjectId (PK)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Simple password field as requested
});

module.exports = mongoose.model('User', userSchema);
