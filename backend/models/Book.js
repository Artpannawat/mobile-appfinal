const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    // _id is added by default by Mongoose as ObjectId (PK)
    title: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, default: '' },
    status: {
        type: String,
        enum: ['available', 'borrowed'],
        default: 'available'
    }
});

module.exports = mongoose.model('Book', bookSchema);
