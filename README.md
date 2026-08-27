# SolzQuiz

A lightweight quiz application with a React frontend and a FastAPI backend (MongoDB). Designed for running quizzes, collecting answers, and reviewing results via an admin interface.

Key goals:
- Simple local development setup
- Clear separation between frontend (React + Tailwind / shadcn UI) and backend (FastAPI + Motor)
- Easy seeding / uploading of question sets

---

## Stack
- **Language(s):** JavaScript (React) + Python
- **Framework / runtime:**
  - Frontend: React (Create React App + CRACO), Tailwind CSS, shadcn UI components
  - Backend: FastAPI (async) + Motor (async MongoDB client)
- **Notable libraries:**
  - Frontend: Tailwind, CRACO, shadcn/react UI components
  - Backend: fastapi, motor, pydantic, python-dotenv, openpyxl (for bulk upload)

---

## Repo layout (top-level)
```
.
├── backend/                # FastAPI backend (server.py, seed_questions.py, requirements)
├── frontend/               # React frontend (src/, package.json, CRACO/Tailwind configs)
├── memory/                 # (project-specific data / caches)
├── tests/                  # tests (backend/frontend)
├── test_reports/           # test output / reports
├── design_guidelines.json  # design notes
├── test_result.md
├── .gitignore
└── README.md               # <- (this file)
```

How it fits together:
- Frontend (frontend/) is a React single-page app that calls the backend API.
- Backend (backend/) is a FastAPI app (backend/server.py) that persists sessions, participants and question data in MongoDB. The backend exposes endpoints for signing in, submitting answers, session status, and several admin endpoints for managing participants and uploading questions.

---

## Quick start — prerequisites
- Node.js (recommend 18+)
- Python (recommend 3.10+)
- MongoDB instance (local or remote)
- Git

---

## Environment variables
Create a `.env` file in `backend/` (or set env vars in your environment). Required:
- MONGO_URL — MongoDB connection string (e.g. mongodb://localhost:27017)
- DB_NAME — database name to use (e.g. solzquiz)

Optional:
- ADMIN_PASSWORD — admin login password (default: `admin123`)
- SESSION_TIMEOUT_MINUTES — session timeout in minutes (default: `15`)
- SESSIONS and CORS config can be set via env but default values are present in code.

---

## Run the backend (local)
1. Create and activate a Python virtual environment:
   ```
   cd backend
   python -m venv .venv
   source .venv/bin/activate   # macOS / Linux
   .venv\Scripts\activate      # Windows (PowerShell)
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Ensure `.env` contains `MONGO_URL` and `DB_NAME` (see Environment variables).

4. Start the server with Uvicorn (reload for dev):
   ```
   uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at: http://localhost:8000 (or the host/port you choose).

OpenAPI docs: http://localhost:8000/docs

---

## Run the frontend (local)
1. From repo root:
   ```
   cd frontend
   npm install
   npm start
   ```
   or
   ```
   yarn
   yarn start
   ```

2. Frontend typically served at: http://localhost:3000

Note: CRACO + Tailwind are configured in the frontend folder; if you adjust Tailwind or CRACO configs you may need to restart the dev server.

---

## Seeding / Uploading Questions
There are two common ways to load questions:

1. Seed file (script)
   - The repo contains `backend/seed_questions.py` which includes a set of example questions. Inspect that file for format and usage. You can run it locally (ensure your `.env` is set).
   - If the seed script exposes a CLI, run it (example):
     ```
     python backend/seed_questions.py
     ```
     (If the script requires args, see the top of the file for usage details.)

2. Admin bulk upload (recommended for production/admin flows)
   - The backend supports an admin endpoint to upload question files (Excel spreadsheets).
   - Endpoint (multipart upload): `POST /admin/questions/upload` — send an `.xlsx` file payload.
   - This endpoint reads questions via `openpyxl` on the server and inserts them into the DB.

---

## Important API endpoints (overview)
- GET /                 — root health/info
- GET /session/status   — returns current session status (active, expires_at, totals)
- POST /signin          — participant sign-in (payload: name/email/participant id details)
- POST /submit          — submit answers for a participant / attempt
- POST /session/close   — close the active session (admin)
- POST /admin/login     — admin authentication (password)
- GET /admin/participants — list participants (admin)
- POST /admin/questions/upload — upload `.xlsx` file with questions (admin)

For full request/response shapes consult the OpenAPI docs at /docs when the server is running.

---

## Running tests
- Backend tests (pytest):
  ```
  cd backend
  pytest -q
  ```
  (There's a `pytest.ini` in `backend/`.)

- Frontend tests:
  ```
  cd frontend
  npm test
  ```

---

## Useful commands
- Backend lint / formatting: run your usual tools (black / isort / flake8) in `backend/`.
- Frontend: `npm run build` to create production build.

---

## Development tips
- Use a Dockerized MongoDB for easy local setup:
  ```
  docker run -p 27017:27017 -d --name solz-mongo mongo:6
  ```
  then set `MONGO_URL=mongodb://localhost:27017` and `DB_NAME=solzquiz`.

- If you change CORS or frontend origin, update `CORS_ORIGINS` (env var or code).

- Admin flows are protected by a simple password stored in `ADMIN_PASSWORD`. For production, integrate proper auth.

---

## Contributing
- Open an issue for any bug/feature request.
- Fork -> branch -> PR with tests where appropriate.
- Add a short description of changes in PR and reference related issues.

---

## Next improvements (ideas)
- Add a migration or DB seed management tool.
- Add user authentication (JWT) for admin endpoints.
- Add CI to run backend/frontend tests and linting.
- Add a LICENSE file (currently none present in repo).

---

If anything in this README doesn't match the actual code layout or usage, open `backend/server.py` and `frontend/README.md` to inspect the exact shapes of env vars, endpoints, and scripts; the code contains detailed route handlers and models (Pydantic) that define payloads and responses.
