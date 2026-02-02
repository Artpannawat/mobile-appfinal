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
    requestDate: {
        type: Date,
        default: Date.now
    },
    borrowDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'return_pending', 'returned', 'rejected'],
        default: 'pending'
    }
});

module.exports = mongoose.model('BorrowTransaction', borrowTransactionSchema);
