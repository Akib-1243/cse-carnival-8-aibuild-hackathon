# CampusOS

CampusOS is a React dashboard and AI assistant for managing live campus schedules, rooms, events, announcements, and assignments. Data is stored persistently in SQLite and shared by the dashboard and backend API.

## Tech Stack

- Frontend: React, Vite, React Router, TanStack Query, Tailwind CSS
- Backend: Node.js, Express, CORS
- Database: SQLite
- AI: OpenAI-compatible chat API, configurable for Groq or another provider
- Languages: JavaScript and JSX

## Setup

Requirements: Node.js 18+ and npm.

Backend, in terminal 1:

```bash
cd backend
npm install
npm run dev
```

Frontend, in terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`.
The backend imports seed data into `backend/campusos.sqlite` on first startup.

## Environment Variables

Copy `.env.example` to `.env`. Optional backend settings go in `backend/.env`.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Frontend | Backend API URL; defaults to `http://localhost:5000/api` |
| `PORT` | No | Backend port; defaults to `5000` |
| `DATABASE_PATH` | No | SQLite path; defaults to `backend/campusos.sqlite` |
| `LLM_API_URL` | No | OpenAI-compatible chat API URL |
| `LLM_API_KEY` | No | LLM provider key; never commit it |
| `LLM_MODEL` | No | LLM model name |

## Using the Agent

Open the assistant in the dashboard and try:

- `When is my next class?`
- `What assignments do I have due this week?`
- `Show me high priority announcements.`
- `Which labs have a projector and can fit at least 30 people?`
- `Is Room 7A02 available tomorrow from 3 PM to 5 PM?`

## Submission Checklist

- [ ] Repository is public.
- [ ] Backend and frontend start with the commands above.
- [ ] All five dashboard sections are visible.
- [ ] Add, edit, and delete changes persist after reload.
- [ ] No API keys or secrets are committed.

## References

- [Problem statement](PROBLEM_STATEMENT.md)
- [Schema](schema/schema.md)
- [Sample queries](sample_queries/sample_queries.md)
- [Submission rules](SUBMISSION.md)
