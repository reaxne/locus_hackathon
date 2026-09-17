# Locus frontend

React + TypeScript + Vite admission planner. The backend is the existing **LocusBackend** checkout, located in this environment at `C:/Users/Amir/PycharmProjects/LocusBackend`. There is no separate `backend/` implementation in this frontend repository.

## Run both applications

In LocusBackend, create a working Python 3.12+ virtual environment and install `requirements-dev.txt`. Copy `.env.example` to `.env`, configure a dedicated PostgreSQL `DATABASE_URL`, then run:

```powershell
python -m uvicorn main:app --env-file .env --host 127.0.0.1 --port 8000
```

In this frontend repository:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Use the same hostname consistently. Vite forwards `/api/auth/*` and `/api/survey` to LocusBackend's `/auth/*` and `/survey`, removing the frontend-only `/api` prefix. `API_UPSTREAM` can override http://127.0.0.1:8000. The production Node static server uses the same proxy; build with `npm run build`, then `npm start`.

For Docker, set `LOCUS_BACKEND_PATH` to the existing LocusBackend folder and `POSTGRES_PASSWORD` to a long URL-safe password, then run `docker compose up --build`. This local HTTP setup serves http://127.0.0.1:3000. Docker was not available for verification here. Production requires HTTPS, `COOKIE_SECURE=true`, an exact allowed frontend Origin in LocusBackend and a reachable PostgreSQL service. Static-only hosting also needs an `/api` reverse proxy.

## Authentication and walkthrough

1. Choose **Создать аккаунт**. Enter a username (3–50 Latin letters, digits or underscores) and password (8–128 characters). These are LocusBackend's existing rules; login does not use email.
2. The frontend calls `POST /auth/register`, then `POST /auth/login`, then `GET /auth/me`. Registration opens the questionnaire at question one.
3. Answer one question at a time. Valid edits, answered question IDs and the current step autosave through `POST /survey`. Wait for **Ответы сохранены в аккаунте** before closing the tab.
4. Refresh or sign out and back in to resume the saved draft. Each authenticated user has separate PostgreSQL records.
5. Complete or skip all questions to submit the profile and open recommendations.
6. Edit any answer in **Профиль**. These edits use the same `POST /survey` route and immediately update matching/roadmap calculations. Exam goals, language, academic performance and constraints are saved with the profile too.
7. Save failures remain visible and keep edits in memory for retry. Stale revisions or a changed account in another tab require explicitly loading the server version. Normal logout waits for successful saves; explicit **Выйти без сохранения последних изменений** discards unsaved changes when needed.

LocusBackend still returns Bearer tokens for existing API clients. Browser login additionally sets an HttpOnly, SameSite cookie; the frontend uses `credentials: 'include'` and stores no tokens or profiles in localStorage. Cookie mutations use `X-Locus-Request: 1` and an allowed Origin. The browser never receives database credentials. Email verification, password reset and Google OAuth are not implemented.

The current backend scope is authentication, questionnaire and profile. University lists, activity entries, task completion and theme remain session-memory features. Optional JSON profile downloads are explicit exports, not API storage. Historical localStorage migration helpers remain pure validation utilities and are not used for live persistence.

## Existing API contract and field mapping

| Frontend request          | LocusBackend route    | Behavior                                                  |
| ------------------------- | --------------------- | --------------------------------------------------------- |
| POST `/api/auth/register` | POST `/auth/register` | `{username,password}` → `{id,username}`                   |
| POST `/api/auth/login`    | POST `/auth/login`    | Existing token response plus browser session cookie       |
| GET `/api/auth/me`        | GET `/auth/me`        | Current user                                              |
| POST `/api/auth/logout`   | POST `/auth/logout`   | Revoke session                                            |
| GET `/api/survey`         | GET `/survey`         | Restore questionnaire/profile; 404 means no saved answers |
| POST `/api/survey`        | POST `/survey`        | Autosave draft, submit or edit profile                    |

`src/lib/api.ts` maps `ApplicantProfile` to the existing `{survey: {...}}` payload: SAT/IELTS/NUET/UNT/AET become top-level scores or null, funding becomes the backend's funding list, and “Any city” becomes an empty city list. An optional `state` object retains the full typed profile, draft, step, answered IDs and server revision. It preserves exam statuses, exam goals and other fields absent from the original fifteen-question contract. `X-Locus-User` guards against a shared cookie changing accounts in another tab; it never selects data ownership.

Backend validation checks both representations agree, validates frontend fields, and commits the survey/state in one transaction. Every write increments its revision. Legacy API clients can still send/read the fifteen-field payload without `state`. Supported legacy answers are restored; incompatible legacy values produce an error instead of being silently overwritten. The existing recommendation endpoints remain available in LocusBackend; frontend recommendation calculations are unchanged by this integration.

`src/lib/profileSync.ts` serializes/coalesces autosaves. `useAdmission.ts` restores authenticated state and connects changes to existing UI logic. Legacy `demoAccount`/`demoSession` field names are internal compatibility names: they now hold a real backend identity. Their historical `email` field contains the username; no email authentication is implied.

## PostgreSQL and old SQLite data

LocusBackend now stores users, sessions, surveys and program records in PostgreSQL. API storage has no SQLite, JSON-file or in-memory fallback. `DATABASE_URL` is required. The backend startup applies its versioned SQL schema; see LocusBackend's README for setup and extension details. `migrate_sqlite.py` can import previous SQLite records into an empty PostgreSQL database without modifying the source. Review that procedure before switching an existing deployment. Database credentials must be configured locally; test runs do not configure or alter your existing PostgreSQL service.

## Verification

```powershell
npm run typecheck
npm test
npm run build
# Run with a Python environment containing LocusBackend's requirements-dev.txt:
python scripts/test_locus_backend.py --backend C:/path/to/LocusBackend --browser
```

The integration runner starts a separate temporary PostgreSQL cluster on loopback port 54329, runs the existing backend test suite plus integration checks, then optionally tests Chrome desktop/mobile against Python on 8001 and the frontend proxy on 3100. Set `PG_BIN` to the installed PostgreSQL binary directory (Windows default: PostgreSQL 18). It stops its processes afterward. Ignored test database files are retained under `tmp/` for diagnostics. Trust authentication is only for this disposable loopback test cluster. Never point tests at production.

Tests cover existing Bearer auth/survey/recommendation compatibility, PostgreSQL persistence, browser cookies, drafts, submission, profile edits, account isolation, validation, stale revisions, retries and account switches. Frontend unit tests cover API mapping and serialized saving alongside the existing domain tests.

## University sources

The existing repository catalog contains five programs at three Astana universities. This integration does not change or reverify their facts. Sources: [Nazarbayev University](https://apply.nu.edu.kz/), [AITU](https://astanait.edu.kz/bachelor), [ENU](https://fit.enu.kz/en/page/departments/department-of-computer-and-software-engineering/educational-programs). Unknown requirements, costs and deadlines remain unknown; historical facts keep their recorded cycle/category. Portfolio suggestions are ideas rather than verified admitted-student projects.

To update the frontend catalog, verify the exact program/year/category on the official site, edit `src/data/universities.ts` while preserving IDs, record source/date/scope, and rerun tests/build. Student profile edits never change shared catalog data. The backend catalog importer writes program records to PostgreSQL; optional JSON import fixtures are source inputs, not API persistence.
