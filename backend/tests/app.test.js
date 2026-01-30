const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create(); // Back to simple create
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
    await BorrowTransaction.deleteMany({});

    // Seed test data
    await User.create({ id: 1, name: 'Test User', email: 'test@example.com' });
    await Book.create({ id: 101, title: 'Test Book', author: 'Test Author', status: 'available' });
    await Book.create({ id: 102, title: 'Borrowed Book', author: 'Test Author', status: 'borrowed' });
});

describe('Library API', () => {
    // Test 1: Get all books
    it('GET /books - should return all books', async () => {
        const res = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
    });

    // Test 2: Borrow a book successfully
    it('POST /borrow - should borrow an available book', async () => {
        const res = await request(app).post('/borrow').send({
            userId: 1,
            bookId: 101
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.transaction).toBeDefined();

        const book = await Book.findOne({ id: 101 });
        expect(book.status).toBe('borrowed');
    });

    // Test 3: Borrow a book that is already borrowed
    it('POST /borrow - should fail if book is already borrowed', async () => {
        const res = await request(app).post('/borrow').send({
            userId: 1,
            bookId: 102
        });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already borrowed/);
    });

    // Test 4: Borrow a non-existent book
    it('POST /borrow - should fail if book does not exist', async () => {
        const res = await request(app).post('/borrow').send({
            userId: 1,
            bookId: 999
        });
        expect(res.statusCode).toBe(400);
    });

    // Test 5: Borrow with non-existent user
    it('POST /borrow - should fail if user does not exist', async () => {
        const res = await request(app).post('/borrow').send({
            userId: 999,
            bookId: 101
        });
        expect(res.statusCode).toBe(400);
    });

    // Test 6: Return a book successfully
    it('POST /return - should return a borrowed book', async () => {
        // Setup transaction first
        await BorrowTransaction.create({
            id: 1,
            user_id: 1,
            book_id: 102,
            borrowDate: new Date()
        });

        const res = await request(app).post('/return').send({
            userId: 1,
            bookId: 102
        });
        expect(res.statusCode).toBe(200);

        const book = await Book.findOne({ id: 102 });
        expect(book.status).toBe('available');

        const trans = await BorrowTransaction.findOne({ id: 1 });
        expect(trans.returnDate).toBeDefined();
    });

    // Test 7: Return a book that is not borrowed by user
    it('POST /return - should fail if no active transaction', async () => {
        const res = await request(app).post('/return').send({
            userId: 1,
            bookId: 101 // This book is available, not borrowed
        });
        expect(res.statusCode).toBe(400);
    });

    // Test 8: Get My Books
    it('GET /my-books/:userId - should return borrowed books', async () => {
        // Setup transaction
        await BorrowTransaction.create({
            id: 1,
            user_id: 1,
            book_id: 102,
            borrowDate: new Date()
        });

        const res = await request(app).get('/my-books/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(102);
    });

    // Test 9: Get My Books empty
    it('GET /my-books/:userId - should return empty list if no books borrowed', async () => {
        const res = await request(app).get('/my-books/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(0);
    });

    // Test 10: Missing parameters for borrow
    it('POST /borrow - should fail if missing parameters', async () => {
        const res = await request(app).post('/borrow').send({
            userId: 1
        });
        expect(res.statusCode).toBe(400);
    });
});
