# Sync Scribe — Collaborative AI Notes Workspace

A full-stack notes application built with the MERN stack (MongoDB, Express, React, Node.js). Users can create and manage notes, organise them with tags and categories, generate AI summaries using OpenAI, share notes publicly, and track productivity through a dashboard.

**Live Links**

- Frontend: https://sync-scribe-mkoiywnf3-sandips-projects-4e25dcc4.vercel.app
- Backend: https://syncscribe-ovn3.onrender.com

---

## Features

- **Authentication** — Signup/login with JWT sessions, bcrypt password hashing
- **Notes Workspace** — Create, edit, archive, and delete notes with auto-save
- **AI Integration** — Generate summaries, extract action items, and suggest titles via Claude (Anthropic)
- **Search & Filtering** — Keyword search, tag filtering, sort by last edited
- **Public Sharing** — Share any note via a unique public URL (no login required to view)
- **Dashboard** — Stats, weekly activity chart, top tags, recently edited notes

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 18, Vite, React Router  |
| Backend  | Node.js, Express              |
| Database | MongoDB + Mongoose            |
| AI       | OpenAI API                    |
| Auth     | JWT + bcryptjs                |

---

## Project Structure

```
syncscribe/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── utils/          # AI service
│   │   └── server.js       # Entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance
    │   ├── components/     # Layout, shared components
    │   ├── context/        # Auth context
    │   ├── hooks/          # Custom hooks (debounce)
    │   ├── pages/          # Page components
    │   ├── utils/          # Helper functions
    │   └── App.jsx         # Router setup
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)
- AI API key 

### 1. Clone the repository

```bash
git clone https://github.com/sandipsawant10/synScribe.git
cd syncScribe
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncscribe
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
AI_API_KEY=sk-ant-your-key-here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The server starts at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint                        | Auth | Description                      |
|--------|---------------------------------|------|----------------------------------|
| POST   | /api/auth/signup                | —    | Create account                   |
| POST   | /api/auth/login                 | —    | Login                            |
| GET    | /api/auth/me                    | ✓    | Get current user                 |
| GET    | /api/notes                      | ✓    | List notes (supports search/tag) |
| POST   | /api/notes                      | ✓    | Create note                      |
| GET    | /api/notes/:id                  | ✓    | Get single note                  |
| PATCH  | /api/notes/:id                  | ✓    | Update note                      |
| DELETE | /api/notes/:id                  | ✓    | Delete note                      |
| POST   | /api/notes/:id/generate-summary | ✓    | Generate AI summary              |
| POST   | /api/notes/:id/share            | ✓    | Toggle public sharing            |
| GET    | /api/shared/:shareId            | —    | View shared note (public)        |
| GET    | /api/dashboard                  | ✓    | Get dashboard stats              |

### Sample API Responses

**POST /api/auth/login**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "664f3a9c...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-05-14T09:00:00.000Z"
  }
}
```

**POST /api/notes/:id/generate-summary**
```json
{
  "aiSummary": {
    "summary": "Weekly sprint planning discussion covering UI mockups and API structure review.",
    "actionItems": ["Prepare UI mockups by Friday", "Review API structure with the team"],
    "suggestedTitle": "Sprint 12 Planning Notes",
    "generatedAt": "2026-05-14T12:30:00.000Z"
  }
}
```

---

## Database Schema

**User**
```
_id, name, email, password (hashed), aiUsageCount, createdAt, updatedAt
```

**Note**
```
_id, user (ref), title, content, tags[], category,
isArchived, isPublic, shareId (unique, sparse),
aiSummary { summary, actionItems[], suggestedTitle, generatedAt },
lastEditedAt, createdAt, updatedAt
```

---

## Design Decisions

- **Auto-save** uses a 1.2s debounce to save after the user stops typing — no manual save button needed
- **Sparse unique index** on `shareId` means we only index notes that are actually shared
- **Text index** on title + content + tags enables fast MongoDB full-text search
- **Parallel queries** in the dashboard controller using `Promise.all` to avoid sequential DB hits
- **JWT stored in localStorage** — simple and sufficient for this scope; for production, httpOnly cookies would be better
- **AI usage tracked per user** so we can show it on the dashboard and optionally rate-limit later

---

## Environment Variables

| Variable           | Where  | Description                         |
|--------------------|--------|------------------------------------ |
| `PORT`             | Backend | Express server port (default 5000) |
| `MONGODB_URI`      | Backend | MongoDB connection string          |
| `JWT_SECRET`       | Backend | Secret for signing JWTs            |
| `JWT_EXPIRES_IN`   | Backend | Token lifetime (e.g. `7d`)         |
| `AI_API_KEY`       | Backend | AI API key                         |
| `CLIENT_URL`       | Backend | Frontend origin for CORS           |
| `VITE_API_URL`     | Frontend| Backend API base URL               |

---

## Security Notes

- Passwords are hashed with bcrypt (salt rounds: 12)
- All note routes are protected by JWT middleware
- Rate limiting applied globally (200 req / 15 min per IP)
- API keys are never exposed to the frontend
- `.env` is gitignored — only `.env.example` is committed

---

*Built for the Peblo Full Stack Developer Challenge.*
