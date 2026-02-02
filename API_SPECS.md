# 📡 API Specification (API Specs)

**Base URL:** `http://localhost:3000`

---

## 🟢 Public / User Endpoints

### 1. Authentication
*   **POST** `/signup`
    *   **Body:** `{ "name": "...", "email": "...", "password": "..." }`
    *   **Desc:** Register a new user.
*   **POST** `/login`
    *   **Body:** `{ "email": "...", "password": "..." }`
    *   **Desc:** Authenticate user and return token/info (including `isAdmin` flag).

### 2. Books & Search
*   **GET** `/books`
    *   **Query:** `?search=keyword` (Optional)
    *   **Desc:** Get all available books. Supports case-insensitive search by Title or Author. Sorted by Title (A-Z).

### 3. Borrowing System
*   **POST** `/borrow`
    *   **Body:** `{ "userId": "...", "bookId": "..." }`
    *   **Desc:** Request to borrow a book. Sets status to `pending`.
*   **POST** `/return`
    *   **Body:** `{ "userId": "...", "bookId": "..." }`
    *   **Desc:** Request to return a borrowed book. Sets status to `return_pending`.
*   **GET** `/history/:userId`
    *   **Desc:** Get borrow history for a specific user.
    *   **Note:** Includes filtering for "Orphan Transactions" (where book data was deleted) to prevent crashes.

### 4. User Profile
*   **PUT** `/users/:id`
    *   **Body:** `{ "name": "...", "email": "...", "password": "...", "avatar": "..." }`
    *   **Desc:** Update user profile information.
*   **POST** `/upload`
    *   **Body:** `FormData` with `image` file.
    *   **Desc:** Upload profile picture. Returns `{ "imageUrl": "..." }`.

---

## 🛡️ Admin Endpoints

### 1. Dashboard & Management
*   **GET** `/admin/users`
    *   **Desc:** List all registered users (excluding admin).
*   **GET** `/admin/borrows`
    *   **Desc:** List all active transactions (pending, approved, return_pending). Includes calculated `dueDate`.

### 2. Transaction Actions
*   **POST** `/admin/borrow/approve`
    *   **Body:** `{ "transactionId": "..." }`
    *   **Desc:** Approve a borrow request. Sets `dueDate` to +7 days.
*   **POST** `/admin/borrow/reject`
    *   **Body:** `{ "transactionId": "..." }`
    *   **Desc:** Reject a borrow request. Returns book to `available`.
*   **POST** `/admin/return/confirm`
    *   **Body:** `{ "transactionId": "..." }`
    *   **Desc:** Confirm a book return. Sets book to `available`.

### 3. Book Management
*   **POST** `/admin/books`
    *   **Body:** `{ "title": "...", "author": "...", "image": "...", "description": "..." }`
    *   **Desc:** Add a new book to the library.
*   **PUT** `/admin/books/:id`
    *   **Desc:** Update details of an existing book.
*   **DELETE** `/admin/books/:id`
    *   **Desc:** Delete a book from the system. 
    *   **Note:** If a book is deleted while being borrowed, it will no longer appear in the global list, and the user's history will safely ignore the broken reference.
