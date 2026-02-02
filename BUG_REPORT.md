# 🐞 Bug Report & Fixes (บันทึกข้อผิดพลาดและการแก้ไข)

## 🚨 Critical Issue: Error 500 on "My History"

### 🔴 Problem (อาการ)
User reported a **500 Internal Server Error** when accessing the "My Shelf > History" tab.
*   **Cause:** The application crashed when attempting to display a transaction for a book that had been **deleted** by the Admin.
*   **Technical Detail:** The MongoDB query used `.populate('book_id')`. When the referenced book document was missing, Mongoose returned `null` for `book_id`. The code then tried to access `t.book_id.title`, resulting in a runtime crash (`Cannot read properties of null`).

### 🟢 Solution (การแก้ไข)
Implemented a "Sanitization Layer" in the Backend API (`GET /history/:userId`).

1.  **Added Null Check:**
    ```javascript
    // Filter out transactions where the book might have been deleted (book_id is null)
    const validTransactions = transactions.filter(t => {
        if (!t.book_id) console.warn(`Found orphan transaction: ${t._id}`);
        return t.book_id;
    });
    ```
    The system now automatically detects and hides broken transactions instead of crashing.

2.  **Container Rebuild:**
    Forced a Docker container rebuild to ensure the patch was applied to the live environment.

---

## 🔎 Improvement: Search Responsiveness

### 🔴 Problem
Search functionality was slow and did not sort results intuitively.

### 🟢 Solution
1.  **Backend:** Added `.sort({ title: 1 })` to the search query to ensure results appear alphabetically.
2.  **Frontend:** Reduced "Debounce" time from 500ms to **150ms**, making the search feel instant while still protecting the server from spam.

---

## 📱 Improvement: Mobile Responsiveness

### 🔴 Problem
Tab Bar at the bottom was overlapping with system gesture bars on some mobile phones.

### 🟢 Solution
Adjusted `tabBarStyle` in `_layout.tsx`:
*   Increased `height` to `80`.
*   Added `paddingBottom: 20` to create safe space for home indicators.
