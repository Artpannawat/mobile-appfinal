const mongoose = require('mongoose');

const borrowTransactionSchema = new mongoose.Schema({
    // _id is added by default by Mongoose as ObjectId (PK)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    returnDate: {
        type: Date
    }
});

module.exports = mongoose.model('BorrowTransaction', borrowTransactionSchema);
