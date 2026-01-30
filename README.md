# ระบบยืม-คืนหนังสือ (Book Borrowing System)

## Database Design (ER Diagram)

```mermaid
erDiagram
    Users {
        ObjectId _id PK "รหัสอ้างอิงผู้ใช้"
        String name "ชื่อ-นามสกุล"
        String email "อีเมล"
        String password "รหัสผ่าน"
        Boolean isAdmin "Admin หรือไม่"
    }

    Books {
        ObjectId _id PK "รหัสอ้างอิงหนังสือ"
        String title "ชื่อหนังสือ"
        String author "ชื่อผู้แต่ง"
        String image "URL ปก"
        String status "สถานะ (available/borrowed)"
    }

    BorrowTransactions {
        ObjectId _id PK "รหัสรายการ"
        ObjectId user_id FK "อ้างอิง Users"
        ObjectId book_id FK "อ้างอิง Books"
        DateTime borrowDate "วันที่ยืม"
        DateTime returnDate "วันที่คืน"
    }

    Users ||--o{ BorrowTransactions : "ทำการยืม"
    Books ||--o{ BorrowTransactions : "ถูกยืมในรายการ"
