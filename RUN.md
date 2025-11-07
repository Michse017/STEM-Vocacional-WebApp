## RUN: Operational Guide (public and secret-free)

This is the technical runbook to start, operate, and verify the application in local or test environments. It contains no credentials. For an overview, read the README (less technical and more user-friendly). This document complements the README with hands-on steps and database details. The platform also supports optional, student-facing ML guidance (e.g., a STEM affinity report) using pluggable models; admins can recompute results on demand.

---

## Prerequisites (Windows PowerShell)

- Python 3.11+ and pip
- Node.js 18+ and npm (or yarn/pnpm)
- Access to SQL Server (Azure SQL or your instance) and ODBC Driver 17/18 installed
- Local `.env` file (based on `.env.example`) — do not commit it

Install dependencies:

```powershell
pip install -r requirements.txt
cd frontend; npm install; cd ..
```

Tip: check API health at http://127.0.0.1:5000/api/health after starting the backend.

---

## Key environment variables (see `.env.example`)

- FLASK_ENV: development | production
- SECRET_KEY: Flask session key (set a strong value in production)
- FRONTEND_URL: CORS allowed origin for dev (e.g., http://localhost:3000)
- DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_DRIVER, DB_PORT
- JWT_EXPIRES_MIN, JWT_REFRESH_DAYS, JWT_REFRESH_ROTATE
	- Dynamic questionnaires are always enabled; no flag needed.

Note: never publish DB_PASSWORD or SECRET_KEY. Use a local `.env` or CI/CD secrets.

---

## Run commands

The `manage.py` utility simplifies startup.

- Seed base questionnaire (initial structure):
```powershell
python manage.py seed-dynamic
```

- Backend only (API at http://localhost:5000):
```powershell
python manage.py run-public
```

- Backend + Frontend (SPA at http://localhost:3000):
```powershell
python manage.py run-public-full
```
Useful params: `--frontend-port 3001`, `--node-cmd "C:/Program Files/nodejs/npm.cmd"`.

- Ensure user auth columns/indexes (soft migration):
```powershell
python manage.py ensure-user-schema
```

- Create a local admin:
```powershell
python manage.py add-admin <code>
```

- Recompute ML summaries (CLI) for stored responses using current binding:
```powershell
python manage.py recompute-ml --version-id <ID> --only-finalized --limit 100
# or by questionnaire code (uses latest published)
python manage.py recompute-ml --code vocacional
```

---

## Current app state (roles & navigation)

- Unified app with a Landing page.
- Student: default flow (code → credentials → dashboard → primary dynamic questionnaire).
- Admin: go to `/admin` or toggle “I am admin” in the login screen.
- Admin UI (frontend) is organized in two modules with a top segmented control:
	- Questionnaires: card grid without noisy inline actions. Clicking a card opens a dedicated panel for that questionnaire (activate/deactivate, set/unset primary, create version, and list of versions). Editing a version opens the Version Editor in the main area without overlapping other UI.
	- User control: code-based operations panel. The registered users table is now optional and can be shown/hidden on demand to keep the screen uncluttered.
- Assigning the primary questionnaire: use the “Designate primary” action (modal picker). If a primary exists, you can also remove it with “Remove primary”.
- Single session per browser: the “Switch user” button clears `admin_token` and `active_session`.

---

## Main endpoints (technical summary)

Health and CORS
- GET `/api/health`

Admin auth (JWT + refresh cookie)
- POST `/api/auth/admin/login`
- GET `/api/auth/admin/me`
- POST `/api/auth/admin/refresh`
- POST `/api/auth/admin/logout`

Dynamic questionnaires (public)
- GET `/api/dynamic/questionnaires` (list)
- GET `/api/dynamic/questionnaires/:code` (latest published structure)
- GET `/api/dynamic/questionnaires/:code/mine?user_code=...` (status + draft)
- POST `/api/dynamic/questionnaires/:code/save` (tolerant autosave)
- POST `/api/dynamic/questionnaires/:code/finalize` (strict validation and close)
- GET `/api/dynamic/my-questionnaires?user_code=...` (user overview)

Note: README lists endpoints briefly; this runbook keeps operational details.

Admin (secured by JWT; cookie refresh)
- GET `/api/admin/questionnaires` (list with primary flag and version summaries)
- POST `/api/admin/questionnaires` (create)
- PATCH `/api/admin/questionnaires/:code` (activate/deactivate)
- POST `/api/admin/questionnaires/:code/set-primary` (set/unset primary)
- POST `/api/admin/questionnaires/:code/new-version` (create new draft version)
- GET `/api/admin/versions/:id` (version details)
- POST `/api/admin/versions/:id/publish` (publish)
- PATCH `/api/admin/versions/:id` (partial updates like status)
- DELETE `/api/admin/versions/:id` (delete draft)
- POST `/api/admin/versions/:id/clone` (clone to draft)
- POST `/api/admin/versions/:id/insert-icfes-package` (helper to insert ICFES block)
- GET `/api/admin/versions/:id/questions` (ordered questions for that version)
- GET `/api/admin/versions/:id/responses/wide` (pivoted responses; filters + pagination)
- GET `/api/admin/responses/:response_id` (response detail)
- POST `/api/admin/versions/:id/ml/recompute` (admin backfill ML for assignments; options: only_finalized, limit, dry_run)
- GET `/api/admin/users?q=&page=&page_size=` (registered users; search + pagination)

---

## Local testing

The `run_tests.py` runner preflights health and executes API tests (smoke/E2E). With the backend running at port 5000:

```powershell
python run_tests.py
```

Helpful test env vars:
- TEST_BASE_URL (default `http://127.0.0.1:5000`)
- E2E_ADMIN_CODE, E2E_ADMIN_PASSWORD to unskip the admin E2E

Tests use real HTTP calls and do not import Flask/SQLAlchemy directly.

---

## ML integration quick notes

- Example model provided: a simple scikit‑learn binary classifier (joblib) is included as a template. Replace the artifact and adjust `metadata_json.ml_binding` via the Admin Wizard or manually.
- Default runtime is scikit‑learn. Torch is optional; if not installed, inference is safely skipped with a reason.
- Artifacts are looked up by path; if the relative path is missing, the loader also searches `models/` and `backend/models/` by filename.

---

## Current database tables & dependencies

- usuarios
- admin_users
- dq_questionnaire
- dq_questionnaire_version
- dq_section
- dq_question
- dq_option
- dq_assignment
- dq_response
- dq_response_item
- dq_change_log

Quick description
- usuarios: students; unique `codigo_estudiante`, `username`/`password_hash`, timestamps.
- admin_users: admins; unique `codigo`, `password_hash`, `is_active`.
- dq_questionnaire: catalog (unique code, status, `is_primary`). Parent of versions.
- dq_questionnaire_version: versions per questionnaire (FK). Parent of sections and assignments.
- dq_section: sections (FK to version). Parent of questions.
- dq_question: questions (FK to section). Parent of options. Referenced by responses.
- dq_option: options per question (FK to question).
- dq_assignment: assignment to a student (`user_code`) for a version (FK). Parent of responses.
- dq_response: response session (FK to assignment). Parent of items.
- dq_response_item: per-question answer (FK to response; references question without cascade).
- dq_change_log: change log.

FK map
- dq_questionnaire → dq_questionnaire_version → dq_section → dq_question → dq_option
- dq_questionnaire_version → dq_assignment → dq_response → dq_response_item
- dq_response_item → dq_question (reference)

---

## Security & best practices

- Do not commit `.env`. Use `.env.example` as guidance.
- Admin header fallback has been removed; admin auth is JWT-only.
- Refresh cookies (admin) are HttpOnly; in production use HTTPS and `Secure` flag.
- CORS: allow `FRONTEND_URL` in dev; restrict origins in production.
- Rate limiting enabled for sensitive routes.
- Logging: avoid printing sensitive data in production.

---

## Troubleshooting (Windows)

- npm not found (WinError 2): install Node.js or use `--node-cmd "C:/Program Files/nodejs/npm.cmd"`.
- If `pymssql` fails on Python 3.13, backend falls back to `pyodbc`. Ensure ODBC Driver 17/18 is installed.
- If you get 401s as admin, use “Switch user” to clear `admin_token` and `active_session`, then login again.

