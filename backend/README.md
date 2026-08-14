# Expense Tracker Backend

REST API for the Expense Tracker app with MongoDB, JWT auth, httpOnly refresh cookies, email verification, transaction categorization, support tickets, admin routes, and the protected AI assistant endpoint.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Optional integrations:

```env
GROQ_API_KEY=
GROQ_MODEL=moonshotai/kimi-k2-instruct
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
BREVO_API_KEY=
EMAIL_FROM=noreply@expense-tracker.app
```

Run locally:

```bash
npm run dev
```

Run in production:

```bash
npm start
```

## Auth

- Access JWT expires in 15 minutes.
- Refresh JWT expires in 7 days.
- Refresh token is stored in an `httpOnly` cookie.
- Refresh token hash and expiry are stored in MongoDB sessions.
- Frontend stores the access token in memory only, not `localStorage`.

## Main Routes

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify
GET  /api/auth/me
POST /api/auth/refresh
POST /api/auth/logout

GET    /api/transactions
POST   /api/transactions
POST   /api/transactions/categorize
GET    /api/transactions/summary
DELETE /api/transactions/:id

PUT /api/user/profile
PUT /api/user/email
PUT /api/user/password

POST /api/support
GET  /api/support

POST /api/ai/chat
```

## Deployment

Backend:

1. Set `NODE_ENV=production`.
2. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. Set optional service keys on the backend only: `GROQ_API_KEY`, `GEMINI_API_KEY`, `BREVO_API_KEY`.
4. Use `npm start` as the start command.

Frontend:

1. Set `VITE_API_URL` to the deployed backend API URL ending in `/api`.
2. Do not put private keys in frontend `VITE_` variables.
3. For Vercel, `frontend/vercel.json` rewrites routes to `index.html`.
4. For Netlify, `frontend/public/_redirects` rewrites routes to `index.html`.

## Security Notes

- Passwords are hashed with `bcryptjs`.
- Refresh cookies use `SameSite=Lax` locally and `SameSite=None; Secure` in production.
- Private API keys must stay in backend environment variables.
- Each user can only access their own data through protected routes.
