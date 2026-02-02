# 🚀 คู่มือทดสอบ API ด้วย Postman (Postman Cheat Sheet)

**Base URL:** `http://localhost:3000`
**Header:** `Content-Type: application/json`

---

## 1. 🔐 โซนยืนยันตัวตน (Authentication)

### 🟢 1.1 Register (สมัครสมาชิก)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/signup`
*   **Body (JSON):**
    ```json
    {
      "name": "Test User",
      "email": "test@example.com",
      "password": "password123"
    }
    ```

### 🟢 1.2 Login (เข้าสู่ระบบ)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/login`
*   **Body (JSON):**
    ```json
    {
      "email": "test@example.com",
      "password": "password123"
    }
    ```
    > **Note:** ก็อปปี้ `_id` ที่ได้จาก Response เก็บไว้ใช้แทน `userId` ในคำสั่งอื่น

---

## 2. 📚 โซนผู้ใช้งานทั่วไป (User)

### 🟢 2.1 Get All Books (ดีงรายชื่อหนังสือ)
*   **Method:** `GET`
*   **URL:** `{{base_url}}/books`
*   **URL (Search):** `{{base_url}}/books?search=Harry`

### 🟢 2.2 Borrow Book (ยืมหนังสือ)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/borrow`
*   **Body (JSON):**
    ```json
    {
      "userId": "REPLACE_WITH_USER_ID",
      "bookId": "REPLACE_WITH_BOOK_ID"
    }
    ```

### 🟢 2.3 Return Book (คืนหนังสือ)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/return`
*   **Body (JSON):** (เหมือนกับ Borrow)
    ```json
    {
      "userId": "REPLACE_WITH_USER_ID",
      "bookId": "REPLACE_WITH_BOOK_ID"
    }
    ```

### 🟢 2.4 My History (ประวัติการยืม)
*   **Method:** `GET`
*   **URL:** `{{base_url}}/history/REPLACE_WITH_USER_ID`

---

## 3. 🛡️ โซนผู้ดูแลระบบ (Admin)

### 🔴 3.1 Get All Users (ดูรายชื่อสมาชิก)
*   **Method:** `GET`
*   **URL:** `{{base_url}}/admin/users`

### 🔴 3.2 Get Active Borrows (ดูรายการยืมค้างอยู่)
*   **Method:** `GET`
*   **URL:** `{{base_url}}/admin/borrows`

### 🔴 3.3 Add Book (เพิ่มหนังสือใหม่)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/admin/books`
*   **Body (JSON):**
    ```json
    {
      "title": "New Book 2024",
      "author": "John Doe",
      "description": "Best seller book",
      "image": "https://example.com/cover.jpg",
      "status": "available"
    }
    ```

### 🔴 3.4 Approve Borrow (อนุมัติให้ยืม)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/admin/borrow/approve`
*   **Body (JSON):**
    ```json
    {
      "transactionId": "REPLACE_WITH_TRANSACTION_ID"
    }
    ```
    > **Tip:** เอา `transactionId` มาจาก API `/admin/borrows`

### 🔴 3.5 Confirm Return (ยืนยันรับคืน)
*   **Method:** `POST`
*   **URL:** `{{base_url}}/admin/return/confirm`
*   **Body (JSON):**
    ```json
    {
      "transactionId": "REPLACE_WITH_TRANSACTION_ID"
    }
    ```
