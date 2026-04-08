# 🧾 Expense Tracker — MERN Backend

A full REST API backend for the Expense Tracker app. Replaces `localStorage` with MongoDB Atlas + JWT auth.

---

## 📁 Project Structure

```
expense-tracker-backend/
├── server.js                  ← Entry point
├── .env.example               ← Copy to .env and fill in values
├── package.json
│
├── models/
│   ├── User.model.js          ← User schema (bcrypt password hashing)
│   └── Transaction.model.js   ← Transaction schema
│
├── controllers/
│   ├── auth.controller.js     ← register, login, getMe
│   ├── transaction.controller.js ← CRUD + summary
│   └── user.controller.js     ← update profile & password
│
├── routes/
│   ├── auth.routes.js
│   ├── transaction.routes.js
│   └── user.routes.js
│
├── middleware/
│   └── auth.middleware.js     ← JWT protect middleware
│
└── frontend-src/              ← Drop these into your React src/
    ├── api.js                 → src/services/api.js
    └── expenseContext.jsx     → src/context/expenseContext.jsx  (replaces old one)
```

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
cd expense-tracker-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/expense-tracker
JWT_SECRET=some_long_random_secret_string
CLIENT_URL=http://localhost:5173
```

### 3. Start server
```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at → `http://localhost:5000`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password}` | ❌ | Create account |
| POST | `/api/auth/login` | `{email, password}` | ❌ | Login |
| GET  | `/api/auth/me` | — | ✅ | Get current user |

### Transactions
| Method | Endpoint | Params/Body | Auth | Description |
|--------|----------|-------------|------|-------------|
| GET  | `/api/transactions` | `?type=income\|expense&page=1&limit=50` | ✅ | List transactions |
| POST | `/api/transactions` | `{to, amount}` | ✅ | Add transaction |
| DELETE | `/api/transactions/:id` | — | ✅ | Delete transaction |
| GET | `/api/transactions/summary` | — | ✅ | Get balance summary |

### User
| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| PUT | `/api/user/profile` | `{name, avatar}` | ✅ | Update profile |
| PUT | `/api/user/password` | `{currentPassword, newPassword}` | ✅ | Change password |

> ✅ Auth = send `Authorization: Bearer <token>` header

---

## ⚛️ Frontend Integration

### Step 1 — Add API URL to your Vite env
In your React project root, create/edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Step 2 — Copy the new frontend files
```
frontend-src/api.js           →  src/services/api.js
frontend-src/expenseContext.jsx → src/context/expenseContext.jsx
```

### Step 3 — Create a Login page
Since the app now needs authentication, create a simple login form that calls:
```js
const { login, register } = useExpense();

// Login
await login(email, password);

// Register
await register(name, email, password);
```

### Step 4 — Transaction IDs
MongoDB uses `_id` instead of `id`. If you add delete buttons, use `t._id`.
The `addTransactions` signature is unchanged: `addTransactions({ to, amount })`.

---

## 🌐 Deploy (Render / Railway)

1. Push backend to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set environment variables in the dashboard
4. Set `CLIENT_URL` to your deployed frontend URL
5. Update frontend's `VITE_API_URL` to your backend URL

---

## 🔒 Security Notes

- Passwords are hashed with `bcryptjs` (cost factor 12)
- JWT expires in 7 days by default
- Each user can only access their own transactions (ownership enforced in DB queries)
- Balance validation happens server-side — expenses are rejected if they exceed balance
