# STEM Vocational – Web Data Collection Tool

A web application to collect information about dimensions that influence vocational orientation toward STEM careers (cognitive, family, socioeconomic, and self-efficacy) via online questionnaires. The focus is on data integrity and availability in the cloud during 2025, with a clear student flow and a secure admin panel.

This README gives a practical overview. For operational steps and technical commands, see the complementary RUN.md (public and secret‑free).

## Goals (summary)

- Enable structured and reliable data collection from 300+ students with validation and traceability.
- Provide an admin panel to design questionnaire versions and manage publication.
- Ensure data durability and availability (cloud backup and recovery tests are encouraged as part of the 2025 rollout).

## Key Features

- Versioned dynamic questionnaire (publish versions; set a primary questionnaire)
- Answer validations (numbers, dates, conditional visibility, multi‑select with “None/All” patterns, and inline “Other” text)
- Simple student flow: code → credentials → dashboard → primary questionnaire
- Admin panel (JWT + refresh cookie, rate limiting) to create/clone/publish/edit questionnaires
- Public API to list and submit questionnaires; health and CORS configurable per environment
- Minimal logging in production (avoid exposing sensitive data)

## Tech Stack

- Backend: Python (Flask), SQLAlchemy, PyODBC/PyMSSQL (SQL Server), Flask‑Limiter, PyJWT
- Frontend: React (SPA)
- Infra: SQL Server (local/Azure); environment‑driven configuration
- Tests: pytest (smoke/API/light E2E)

## Quick Start (local)

1) Requirements: Python 3.11+, Node.js 18+, ODBC Driver 17/18, and an accessible SQL Server.
2) Install dependencies:

```powershell
pip install -r requirements.txt
cd frontend; npm install; cd ..
```

3) Create a `.env` from `.env.example` (do not commit it).
4) Optional: seed base content:

```powershell
python manage.py seed-dynamic
```

5) Start backend + frontend:

```powershell
python manage.py run-public-full
```

Backend: http://localhost:5000  |  Frontend: http://localhost:3000  |  Health: http://localhost:5000/api/health

## Usage (flows)

- Student
  - Start at the Landing → student login (code) → set credentials if needed → Dashboard → complete the primary questionnaire.
  - Partial save and strict finalize supported.

- Administrator
  - Go to /admin or toggle “I am admin” in the login.
  - Authentication with JWT access token and HttpOnly refresh cookie.
  - Create/edit sections/questions/options, clone versions, publish, and set the primary questionnaire.

## Key Endpoints

- Health/CORS: GET `/api/health`
- Dynamic (public):
  - GET `/api/dynamic/questionnaires`
  - GET `/api/dynamic/questionnaires/:code`
  - GET `/api/dynamic/questionnaires/:code/mine?user_code=...`
  - POST `/api/dynamic/questionnaires/:code/save`
  - POST `/api/dynamic/questionnaires/:code/finalize`
- Admin (JWT):
  - POST `/api/auth/admin/login`, GET `/api/auth/admin/me`, POST `/api/auth/admin/refresh`, POST `/api/auth/admin/logout`

See RUN.md for additional routes and operational details.

## Environment Variables (summary)

See `.env.example` and configure your local `.env` (do not publish it):

- FLASK_ENV, SECRET_KEY, FRONTEND_URL
- DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_DRIVER, DB_PORT
- JWT_EXPIRES_MIN, JWT_REFRESH_DAYS, JWT_REFRESH_ROTATE
  - Dynamic questionnaires are always enabled (no flag required)
  - Admin auth is JWT-only (no header fallback)

## Quick Tests

With the backend running:

```powershell
python run_tests.py
```

This runs smoke/API tests and E2E (if you set E2E_ADMIN_*). Tests hit real endpoints and avoid coupling to internals.

---

Security note: never commit credentials or secrets. Use a local `.env` or CI/CD secrets.
 