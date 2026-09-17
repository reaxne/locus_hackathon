# Locus frontend

React + TypeScript + Vite frontend for the existing LocusBackend project (`C:/Python/LocusBackend` in this workspace). Backend source and configuration are not modified by this frontend integration.

## Run

Start LocusBackend using its own README, with PostgreSQL and its Python dependencies configured. For local HTTP, the backend needs `COOKIE_SECURE=false` and the exact frontend origin in `ALLOWED_ORIGINS`.

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies every `/api/*` request to `http://127.0.0.1:8000/*`. Set `API_UPSTREAM` to use another backend address. Use the same hostname consistently so session cookies work.

Production: `npm run build`, then `npm start`. The Node server serves the build and forwards `/api/*` to the same configurable upstream. It contains no authentication, recommendation engine or data storage. Static-only hosting requires an equivalent reverse proxy. HTTPS deployments need secure cookies and an allowed origin configured in the backend.

## API integration

| Frontend request                    | Existing backend endpoint   | Purpose                                                                                     |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| POST `/api/auth/register`           | `/auth/register`            | Register with username and password                                                         |
| POST `/api/auth/login`              | `/auth/login`               | Set the HttpOnly session cookie                                                             |
| GET `/api/auth/me`                  | `/auth/me`                  | Restore and verify account identity                                                         |
| POST `/api/auth/logout`             | `/auth/logout`              | Revoke the session                                                                          |
| GET `/api/survey`                   | `/survey`                   | Restore the questionnaire and profile                                                       |
| POST `/api/survey`                  | `/survey`                   | Save draft, questionnaire progress and profile using revisions                              |
| GET `/api/recommendations?limit=50` | `/recommendations?limit=50` | Load ranked programs, explanations, budget decisions, requirements, roadmap and next action |

`src/lib/api.ts` sends cookies and the backend's browser security headers. Survey writes retain the existing fifteen-field `survey` payload plus the full `state` supported by LocusBackend. There are no credentials, tokens or profile snapshots in localStorage.

`src/lib/profileSync.ts` serializes/coalesces questionnaire saves and handles revision conflicts. `src/hooks/useAdmission.ts` waits for the latest survey to be successfully saved before requesting recommendations. Failed saves block refresh; save retry also refreshes recommendations. Profile/account changes invalidate displayed results, and late responses are ignored. Recommendation failures have a retry action and never fall back to local recommendations. Account identity is checked again before displaying results.

`src/lib/recommendations.ts` adapts the backend's camelCase response to the existing UI components. Server order, reasons, warnings, financial decisions, the best admission route, tasks, completion and next action are retained. Task IDs are namespaced by program to prevent collisions. Selecting programs filters the returned tasks; it does not generate new tasks or recalculate eligibility.

Removed: local matching/ranking, local roadmap generation, personalized portfolio generation, the hardcoded university catalog, and unused localStorage migration logic. The frontend retains form validation, formatting, search/filter controls, comparison selection and other UI state. CSS and the visual layout are unchanged.

## Limits of the existing backend

- `/recommendations` returns at most 50 matching programs. There is no public catalog or program-detail endpoint. Program pages and source records display only the returned recommendations.
- The response omits city, degree metadata, language, duration, program code, full document checklists and complete program descriptions. Missing facts remain unknown; the frontend does not fill them from an old local catalog. Source dates are taken from the response.
- Excluded programs are not fabricated into full program cards. Previously selected programs absent from the latest response are not displayed as current matches.
- Saved university labels, activities, task status overrides and theme remain in memory for the current session. No endpoint exists to persist them. The UI describes this limitation. Refresh/logout clears them.
- Exam goals, section scores, study language, academic performance and free-text constraints are saved in the profile state. The existing recommendation endpoint does not use all these fields; this frontend does not add its own scoring rules for them.
- Portfolio suggestions come only from the server's `portfolio_activity` tasks. The API has no activity category field; these are displayed in the UI's general personal-project category. Manually entered activities are session UI state.
- Server task completion is authoritative. Manual session marks do not update server task dependencies or its next-action decision; if its next action is marked complete locally, no substitute is calculated in the frontend.
- Server text is displayed as supplied (the current backend often returns English explanations).

These gaps require backend API changes for full feature parity. They are intentionally not implemented in the frontend or by modifying LocusBackend.

## Checks

```powershell
npm run typecheck
npm test
npm run build
# Isolated desktop/mobile UI tests with mocked API responses:
npx playwright test tests/backend-ui.spec.ts
```

Unit tests cover API payloads, account changes, save serialization/retry and recommendation response adaptation. Browser tests cover server-only program/task rendering, profile-save ordering, late responses, error retry and empty results. Fixtures contain fictional data and are outside the application bundle.

With an independently configured backend Python runtime and PostgreSQL binaries, the existing real-server integration runner is also available:

```powershell
python scripts/test_locus_backend.py --backend C:/Python/LocusBackend --browser
```

The real-server suite needs `requirements-dev.txt` from LocusBackend and PostgreSQL (`PG_BIN`). It uses a separate disposable test cluster; never point it at production. For this change, production build, unit tests and mocked browser tests were run. Real PostgreSQL integration could not be run in the provided environment because `psycopg` and PostgreSQL binaries were unavailable.
