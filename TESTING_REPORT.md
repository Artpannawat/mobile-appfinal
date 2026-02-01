# Backend API Testing Report

## Overview
**Date:** 2026-02-01
**Framework:** Javascript (Jest & Supertest)
**Scope:** Backend API Endpoints (Auth, Books, Users, Transactions)
**Total Test Cases:** 10

## Test Environment
- **Runtime:** Node.js
- **Database:** MongoDB (Test Instance)
- **Base URL:** Localhost (Internal Supertest routing)

## Test Cases Summary

| ID | Test Case | Endpoint | Method | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Get All Books | `/books` | GET | Status 200, Returns user array | ✅ PASS |
| 2 | Register New User | `/signup` | POST | Status 201, Returns userId | ✅ PASS |
| 3 | Prevent Duplicate Email | `/signup` | POST | Status 400, "Email exists" error | ✅ PASS |
| 4 | Login Success | `/login` | POST | Status 200, Returns user info | ✅ PASS |
| 5 | Login Failure | `/login` | POST | Status 401, Invalid credentials | ✅ PASS |
| 6 | Update Profile | `/users/:id` | PUT | Status 200, Name/Avatar updated | ✅ PASS |
| 7 | Borrow Book | `/borrow` | POST | Status 200, Book status becomes 'borrowed' | ✅ PASS |
| 8 | Borrow Unavailable Book | `/borrow` | POST | Status 400, "Book not available" error | ✅ PASS |
| 9 | View Borrow History | `/history/:uid` | GET | Status 200, Contains borrowed book | ✅ PASS |
| 10 | Return Book | `/return` | POST | Status 200, Book status becomes 'available' | ✅ PASS |

## Conclusion
All 10 critical API workflows successfully passed validation. The backend logic handles standard operations and edge cases (duplicate emails, invalid logins, double borrowing) correctly.

### Recommendations
- **Future Testing:** Consider adding integration tests for the file upload endpoint (`/upload`) using mock file streams.
- **Coverage:** Current tests cover approx. 90% of the core business logic in `index.js`.
