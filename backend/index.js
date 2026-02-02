const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Book = require('./models/Book');
const BorrowTransaction = require('./models/BorrowTransaction');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/library_db';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});
const upload = multer({ storage: storage });

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('Connected to MongoDB at ' + MONGO_URI);
            seedData();
        })
        .catch(err => console.error('MongoDB connection error:', err));
}

// --- Seeding Data & Auto-Clean ---
async function seedData() {
    try {
        // Attempt to drop legacy 'id_1' indexes
        try { await User.collection.dropIndex('id_1'); } catch (e) { }
        try { await Book.collection.dropIndex('id_1'); } catch (e) { }
        try { await BorrowTransaction.collection.dropIndex('id_1'); } catch (e) { }

        // FORCE UPSERT ADMIN (Ensures password is '123')
        await User.findOneAndUpdate(
            { email: 'admin' },
            { name: 'Admin User', email: 'admin', password: '123', isAdmin: true },
            { upsert: true, new: true }
        );
        console.log('🔒 Admin User Ensure: email=admin, pass=123');

        // Check/Seed Standard Users
        const userCount = await User.countDocuments({ email: { $ne: 'admin' } });
        if (userCount === 0) {
            console.log('🌱 Seeding Standard Users...');
            await User.create([
                { name: 'John Doe', email: 'john@example.com', password: 'password123' },
                { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' }
            ]);
        }

        // Check/Seed Books
        const bookCount = await Book.countDocuments();
        if (bookCount === 0) {
            console.log('🌱 Seeding Books...');
            await Book.create([
                { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', status: 'available' },
                { title: '1984', author: 'George Orwell', status: 'available' },
                { title: 'Clean Code', author: 'Robert C. Martin', status: 'available' }
            ]);
        }
        console.log('✨ System Ready.');
    } catch (err) {
        console.error('Seeding error:', err);
    }
}

// --- API Endpoints ---

// 0. Upload Endpoint
app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Return relative path
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Signup Endpoint
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
        if (await User.findOne({ email })) return res.status(400).json({ error: 'Email exists' });
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered', userId: newUser._id, name: newUser.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Login Logic
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Return isAdmin flag if email is 'admin'
        const isAdmin = user.email === 'admin';
        res.json({ message: 'Login successful', userId: user._id, name: user.name, email: user.email, avatar: user.avatar, isAdmin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get All Books (with Search)
app.get('/books', async (req, res) => {
    try {
        const { search } = req.query;
        console.log('Search Request:', search); // Debug Log
        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } }
                ]
            };
        }
        const books = await Book.find(query).sort({ title: 1 });
        console.log(`Found ${books.length} books`); // Debug Log
        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Request Borrow Book (User)
app.post('/borrow', async (req, res) => {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId required' });

    try {
        const book = await Book.findOne({ _id: bookId });
        if (!book) throw new Error('Book not found');
        if (book.status !== 'available') throw new Error('Book not available');

        const user = await User.findOne({ _id: userId });
        if (!user) throw new Error('User not found');

        // Set book status to 'pending' to reserve it
        book.status = 'pending';
        await book.save();

        const transaction = new BorrowTransaction({
            user_id: userId,
            book_id: bookId,
            status: 'pending',
            requestDate: new Date()
        });
        await transaction.save();

        res.json({ message: 'Borrow request submitted', transaction });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. Request Return Book (User)
app.post('/return', async (req, res) => {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: 'userId and bookId required' });

    try {
        const transaction = await BorrowTransaction.findOne({
            user_id: userId,
            book_id: bookId,
            status: 'approved'
        });

        if (!transaction) throw new Error('No active approved borrow transaction found');

        transaction.status = 'return_pending';
        await transaction.save();

        res.json({ message: 'Return request submitted', transaction });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- NEW ADMIN ENDPOINTS ---

// Admin Approve Borrow
app.post('/admin/borrow/approve', async (req, res) => {
    const { transactionId } = req.body;
    try {
        const transaction = await BorrowTransaction.findById(transactionId).populate('book_id');
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.status !== 'pending') throw new Error('Transaction is not pending');

        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(borrowDate.getDate() + 7); // 7 Days

        transaction.status = 'approved';
        transaction.borrowDate = borrowDate;
        transaction.dueDate = dueDate;
        await transaction.save();

        // Update book status
        const book = await Book.findById(transaction.book_id._id);
        book.status = 'borrowed';
        await book.save();

        res.json({ message: 'Borrow approved', transaction });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin Reject Borrow
app.post('/admin/borrow/reject', async (req, res) => {
    const { transactionId } = req.body;
    try {
        const transaction = await BorrowTransaction.findById(transactionId).populate('book_id');
        if (!transaction) throw new Error('Transaction not found');

        transaction.status = 'rejected';
        await transaction.save();

        // Revert book status
        const book = await Book.findById(transaction.book_id._id);
        book.status = 'available';
        await book.save();

        res.json({ message: 'Borrow rejected', transaction });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin Confirm Return
app.post('/admin/return/confirm', async (req, res) => {
    const { transactionId } = req.body;
    try {
        const transaction = await BorrowTransaction.findById(transactionId).populate('book_id');
        if (!transaction) throw new Error('Transaction not found');

        transaction.status = 'returned';
        transaction.returnDate = new Date();
        await transaction.save();

        const book = await Book.findById(transaction.book_id._id);
        book.status = 'available';
        await book.save();

        res.json({ message: 'Return confirmed', transaction });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 6. Get My Books / History
app.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Get active or pending transactions
        console.log(`Fetching history for user: ${userId}`);
        const transactions = await BorrowTransaction.find({
            user_id: userId,
            status: { $in: ['pending', 'approved', 'return_pending', 'returned', 'rejected'] }
        }).populate('book_id');

        console.log(`Found ${transactions.length} transactions`);

        // Filter out transactions where the book might have been deleted (book_id is null)
        const validTransactions = transactions.filter(t => {
            if (!t.book_id) console.warn(`Found orphan transaction: ${t._id}`);
            return t.book_id;
        });

        console.log(`Valid transactions: ${validTransactions.length}`);

        const history = validTransactions.map(t => {
            let dueDate = t.dueDate;
            if (!dueDate && t.borrowDate && (t.status === 'approved' || t.status === 'borrowed')) {
                const d = new Date(t.borrowDate);
                d.setDate(d.getDate() + 7);
                dueDate = d;
            } else if (!dueDate && (t.status === 'approved' || t.status === 'borrowed')) {
                // Fallback if even borrowDate is missing for some reason
                const d = new Date();
                d.setDate(d.getDate() + 7);
                dueDate = d;
            }

            return {
                _id: t.book_id._id,
                transactionId: t._id, // Unique Key for React List
                title: t.book_id.title,
                author: t.book_id.author,
                image: t.book_id.image,
                status: t.status,
                borrowDate: t.borrowDate,
                dueDate: dueDate
            };
        });
        res.json(history);
    } catch (err) {
        console.error('History Endpoint Error:', err); // Debug Log
        res.status(500).json({ error: err.message });
    }
});

// 6.5 Update User Profile (Name, Email, Password)
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, avatar } = req.body;
    try {
        const updateData = { name, email, avatar };
        if (password && password.trim() !== '') {
            updateData.password = password; // In production, hash this!
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                avatar: updatedUser.avatar
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN API ---

// 7. Get All Users (Admin)
app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find({ email: { $ne: 'admin' } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Add Book (Admin)
app.post('/admin/books', async (req, res) => {
    const { title, author, image, description } = req.body;
    try {
        if (!title || !author) return res.status(400).json({ error: 'Title and Author required' });
        const newBook = await Book.create({
            title,
            author,
            image: image || '',
            description: description || 'No description available.',
            status: 'available'
        });
        res.json(newBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Update Book (Admin)
app.put('/admin/books/:id', async (req, res) => {
    const { id } = req.params;
    const { title, author, image, description } = req.body;
    try {
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { title, author, image, description },
            { new: true }
        );
        if (!updatedBook) return res.status(404).json({ error: 'Book not found' });
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Delete Book (Admin)
app.delete('/admin/books/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBook = await Book.findByIdAndDelete(id);
        if (!deletedBook) return res.status(404).json({ error: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Get Active Borrows/Requests (Admin)
app.get('/admin/borrows', async (req, res) => {
    try {
        // Get all except returned/rejected (so pending, approved, return_pending)
        const borrows = await BorrowTransaction.find({
            status: { $in: ['pending', 'approved', 'return_pending'] }
        })
            .populate('user_id', 'name email')
            .populate('book_id', 'title');

        const borrowsWithDueDates = borrows.map(b => {
            // For pending requests, we don't have a due date yet, show N/A or projected
            let dueDate = b.dueDate;
            if (!dueDate && b.borrowDate) {
                const d = new Date(b.borrowDate);
                d.setDate(d.getDate() + 7);
                dueDate = d;
            }

            return {
                ...b.toObject(),
                dueDate
            };
        });

        res.json(borrowsWithDueDates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} and accepting connections from all IPs`);
    });
}

module.exports = app;
