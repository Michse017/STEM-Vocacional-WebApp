# STEM Vocational – Web Data Collection Tool

A web application to collect information about dimensions that influence vocational orientation toward STEM careers (cognitive, family, socioeconomic, and self-efficacy) via online questionnaires. It computes a student-facing STEM affinity report using pluggable ML models; results are persisted and visible when students re-enter their finalized questionnaire. The focus is on data integrity and availability, with a clear student flow and a secure admin panel.

This README gives a practical overview. For operational steps and technical commands, see the complementary RUN.md (public and secret‑free).

## Goals (summary)

- Enable structured and reliable data collection from 300+ students with validation and traceability.
- Provide an admin panel to design questionnaire versions and manage publication.
- Provide student-friendly ML guidance (e.g., STEM vs NO_STEM) powered by pluggable models; the report is saved in the response summary, shown in read-only mode after finalize, and can be recomputed by admins.
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

1) Requirements: Python 3.11+ (tested on 3.12.8), Node.js 18+, ODBC Driver 17 or 18, and an accessible SQL Server instance.
2) (Optional but recommended) Create and activate a virtual environment:

```powershell
python -m venv .venv
./.venv/Scripts/Activate.ps1
```

3) Install dependencies:

```powershell
pip install -r requirements.txt
cd frontend; npm install; cd ..
```

4) Create a `.env` from `.env.example` (do not commit it). Fill in DB credentials and a strong `SECRET_KEY`.
5) Seed base questionnaire/content:

```powershell
python manage.py seed-dynamic
```

6) (Optional) Create an admin user for local testing:

```powershell
python manage.py add-admin my_admin_code --password MySecurePass123
```

7) Start backend + frontend:

```powershell
python manage.py run-public-full
```

Backend: http://localhost:5000  |  Frontend: http://localhost:3000  |  Health: http://localhost:5000/api/health

8) (Optional) Run tests once the backend is up:

```powershell
python run_tests.py
```

9) (Optional) Recompute ML results for existing finalized responses if you later change the model binding:

```powershell
python manage.py recompute-ml --code vocacional --only-finalized --dry-run
```

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
  - DELETE `/api/admin/users/:id_usuario` — Delete a user and all associated data (assignments/responses/items)
  - DELETE `/api/admin/versions/:version_id` — Delete a draft/archived version with its data (app‑level cascade). For published versions, safety rules apply.
  - DELETE `/api/admin/questionnaires/:code` — Delete a questionnaire only if it has no published versions (cascade for draft/archived data).
  - GET `/api/admin/ml/models` — List pre‑loaded ML models available to bind (id, name, runtime)
  - GET `/api/admin/ml/models/:model_id` — Return full model configuration, including `input.features` and `feature_order`
  - GET `/api/admin/versions/:version_id/ml/check` — Binding diagnostics: artifact path, existence, mapped features, and `feature_order` consistency
  - POST `/api/admin/versions/:version_id/ml/recompute` — Recompute the ML summary for stored responses (on‑demand backfill)

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


Security note: never commit credentials or secrets. Use a local `.env` or CI/CD secrets.

## ML model binding (beta)

Bind an ML model to a questionnaire version without changing the schema by placing a configuration under `QuestionnaireVersion.metadata_json.ml_binding`.

On finalize, the backend attempts to load the artifact (joblib) and compute:

- `prob` for the positive class (via `positive_label` + `class_names`, or `positive_index`)
- `decision` using the configured `threshold`
- `features` actually used and `traces`

The result is stored in `dq_response.summary_cache["ml"]` and also returned in the finalize response. If the binding is missing or the artifact cannot be loaded, inference is safely skipped with a clear reason.

Design notes:

- v2 binding supports per‑feature transforms (category/boolean maps, `divide_by`, `clip_min/clip_max`, etc.).
- You can control the vector order via `input.feature_order` or a per‑feature `order`.
- Positive class may be selected by `positive_label` + `class_names` (if the estimator exposes `classes_`), or by `positive_index` as a fallback.
- Supported runtimes: scikit‑learn and Torch (`runtime: "torch"`). ONNX is pending.

An example scikit‑learn binary classifier is included as a working template to speed up future integrations.

### Admin mapping wizard

From the version editor (admin), select a pre‑loaded model to see only its required variables. In 1–2 clicks you connect each variable to a code in your questionnaire (no extras are generated). The JSON updates in `metadata_json.ml_binding`, then you can Save.

Wizard endpoints:

- `GET /api/admin/ml/models` — list available models
- `GET /api/admin/ml/models/:model_id` — get `artifact_path`, `runtime`, `class_names`, `positive_label`, `threshold`, and `features` (name, type, predefined transforms)

### Where to place the model artifact (.joblib)

- Recommended: create a `models/` folder at the repo root and place the file there, e.g. `models/model.joblib` then reference it in the binding.
- Alternative: `backend/models/...` also works. The loader will search by basename in `models/` and `backend/models/` if the primary relative path does not exist.
- After updating a binding or artifact you can recompute historical summaries with `python manage.py recompute-ml --version-id <ID> --only-finalized`.
- Environments: you may use an env var with `artifact_path: "env:ML_ARTIFACT_PATH"` and define `ML_ARTIFACT_PATH` to an absolute path in the server.

Notes:
- The loader expands `~` and environment variables. If the file does not exist, inference is skipped with `artifact_missing` without disrupting user flow.
- If the artifact is large, consider Git LFS or publishing it during build/deploy (avoid secrets inside the artifact).

Torch:

1) In your `metadata_json`, set `runtime: "torch"` and provide an artifact that contains a torch module under key `model` and `model_state_dict` (or `state_dict`).
2) Install PyTorch in the backend environment (CPU index URL example): `pip install torch --index-url https://download.pytorch.org/whl/cpu`
3) The service loads the `state_dict` with `strict=False` and uses softmax (multiclass) or sigmoid (binary) to obtain probabilities.
 