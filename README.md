# Expense Voucher Management System

A full-stack web application that digitizes employee expense voucher creation, Director approval, and Accounts monitoring.

## 1. Technology Stack

- **Frontend:** React, Vite, React Router, Axios, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT and bcryptjs
- **File uploads:** Multer
- **Authorization:** Role-based access control

## 2. User Roles

### Employee
- Log in and view personal vouchers.
- Create and save draft vouchers.
- Edit or delete draft vouchers.
- Upload a signature and submit a voucher.
- Track approval status and rejection reasons.

### Director
- View all organization vouchers and pending approvals.
- Search, filter, and sort vouchers.
- Approve vouchers with a Director signature.
- Reject vouchers with a mandatory reason.
- Cannot modify employee-entered voucher details.

### Accounts
- View all organization vouchers.
- Search, filter, and sort vouchers.
- View voucher details, status, and both signatures.
- Cannot create, edit, delete, approve, or reject vouchers.

## 3. Prerequisites

Install:
- Node.js and npm
- MongoDB Community Server, or access to a MongoDB deployment
- Git

## 4. Project Structure

```text
ExpenseVoucherSystem/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── styles.css
│   └── package.json
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── seedUsers.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## 5. Environment Configuration

In `backend/`, create a `.env` file using `.env.example` as a template.

Configure:
- `PORT`: backend port, normally `5000`
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: a randomly generated secret of at least 32 characters
- `CLIENT_URL`: frontend URL, normally `http://localhost:5173`

Never commit `.env` or real credentials to GitHub.

## 6. Installation and Setup

### Backend

```bash
cd backend
npm install
```

Configure `backend/.env`, then seed demo accounts:

```bash
node seedUsers.js
```

Start the backend:

```bash
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Employee | employee@demo.com | Employee@123 |
| Director | director@demo.com | Director@123 |
| Accounts | accounts@demo.com | Accounts@123 |

These accounts are for local demonstration only. Do not use these credentials in a production deployment.

## 7. Database Schema

### User
- `name`: user's full name
- `employeeId`: optional employee identifier
- `email`: unique login email
- `password`: bcrypt-hashed password
- `department`: department name
- `role`: `EMPLOYEE`, `DIRECTOR`, or `ACCOUNTS`
- `createdAt`, `updatedAt`: timestamps

### Voucher
- `voucherNumber`: unique, automatically generated voucher number
- `voucherDate`: voucher creation date
- `expenseDate`: date of the expense
- `department`: department name
- `expenseTitle`: expense title
- `category`: expense category
- `description`: optional description
- `amount`: positive expense amount
- `employee`: reference to the submitting User
- `employeeSignature`: stored employee signature path
- `directorSignature`: stored Director signature path
- `status`: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, or `REJECTED`
- `approvalDate`: date of approval
- `rejectionReason`: reason for rejection
- `reviewedBy`: reference to the reviewing User
- `createdAt`, `updatedAt`: timestamps

### Counter
- `_id`: yearly voucher counter identifier
- `sequence`: incrementing sequence used to generate voucher numbers

### Relationships

- One User can create multiple vouchers.
- Each voucher belongs to one Employee.
- `reviewedBy` identifies the user who reviewed the voucher.
- Signatures are stored as image files; their paths are saved in the voucher document.

## 8. REST API Overview

All protected routes require:

`Authorization: Bearer <JWT_TOKEN>`

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve current user details |
| GET | `/api/health` | Check API health |

### Vouchers

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/vouchers` | Create a draft |
| GET | `/api/vouchers` | List role-authorized vouchers |
| GET | `/api/vouchers/:id` | Retrieve voucher details |
| PUT | `/api/vouchers/:id` | Update an employee's draft |
| DELETE | `/api/vouchers/:id` | Delete an employee's draft |
| PATCH | `/api/vouchers/:id/employee-signature` | Upload employee signature |
| PATCH | `/api/vouchers/:id/submit` | Submit a draft |
| PATCH | `/api/vouchers/:id/approve` | Approve with Director signature |
| PATCH | `/api/vouchers/:id/reject` | Reject with a reason |
| GET | `/api/vouchers/:id/signature/:kind` | Retrieve an authorized signature |

The voucher list supports search, status, department, category, date range, amount range, and sorting parameters implemented by the backend.

Signature upload and approval endpoints use `multipart/form-data`. Rejection uses a JSON body containing `reason`.

## 9. Workflow and Business Rules

1. A new voucher starts in `DRAFT`.
2. Employees can edit or delete only their own drafts.
3. An employee signature is required before submission.
4. Submitted vouchers enter `PENDING_APPROVAL`.
5. Only the Director can approve or reject pending vouchers.
6. A Director signature is required for approval.
7. A rejection reason is mandatory.
8. Approved and rejected vouchers cannot be edited by employees.
9. Employees can view only their own vouchers.
10. Director and Accounts users can view organization vouchers.
11. Backend role checks protect restricted operations.

## 10. Validation and Security

- Passwords are hashed using bcryptjs.
- JWT authentication protects restricted endpoints.
- Role-based middleware restricts privileged actions.
- Voucher numbers are generated using a database counter.
- Amount must be greater than zero.
- Required voucher fields are validated.
- Signature uploads are limited by file type and size in the backend.
- Environment secrets must be kept out of source control.

## 11. Assumptions and Limitations

- Demo users are seeded for evaluation; public registration is not provided.
- MongoDB is used as the database.
- Signature files are stored in the backend uploads directory.
- A production deployment would require durable private file storage, backups, stronger operational monitoring, and a production-grade secret-management strategy.
- The Accounts role monitors approved vouchers; payment execution is outside the defined workflow.
- Features should be considered verified only after the end-to-end tests described below pass.

## 12. Final Verification

Before submission:
- Run `npm run build` in `frontend/`.
- Start MongoDB and the backend.
- Start the frontend and test each demo role.
- Test draft editing/deletion, signature validation, submission, approval, rejection, and Accounts viewing.
- Confirm unauthorized operations are rejected by the backend.
- Never commit `.env`, passwords, or private production data.
