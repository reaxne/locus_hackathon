# Undergraduate admission journey

An extension of the existing React + TypeScript admission-planning project for LOCUS Hackathon 2026, Case 2. Students in grades 9–12 can explore IT-related bachelor's programs in Kazakhstan, save a personal university list, plan activities and exam goals, and follow an actionable roadmap. All site copy is in English. Light, dark and system themes are supported, with no assigned product brand.

## Run locally

Requires Node.js **22.12+** and npm. Dependencies are pinned by `package-lock.json`.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. No API keys, database or paid services are required. Fonts and university records are bundled locally. The app works as static files; the optional Express server only serves those files and supplies an SPA fallback and health check. The sign-in screen is a local demo, not authentication.

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright uses an installed Google Chrome on desktop and an emulated mobile viewport. `npm run test:e2e` starts the production server on port 3000; build first. If Chrome is not installed, install it or change `channel` in `playwright.config.ts` to an installed Playwright browser. Screenshots go to ignored `tmp/screenshots/`. The 23 unit tests cover saved-answer validation, v2 migration, changing matches, source applicability, and roadmap relevance after goal/list/activity changes. The 14 browser tests cover the progressive diagnosis, editing, JSON export, demo sign-in, comparison, portfolio and exam goals, reloads, theme persistence, 320px layouts, damaged data and storage failures.

Preview the production build:

```sh
npm run preview
```

Or use the existing optional hosting wrapper:

```sh
npm run build
npm start
```

The wrapper listens on `PORT` (default 3000), serves `dist/`, returns JSON on `/health`, and returns 404 for missing assets. It has no application backend or user-data endpoints.

## Working journey

| Route                      | Function                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | Start a diagnosis or explore a clearly labeled sample profile                                                             |
| `/diagnosis`               | One question at a time, progress, Back, automatic draft saving and individual answer editing                              |
| `/profile`                 | Editable answer summary, saved exam goals and JSON export                                                                 |
| `/universities`            | Search, university/budget filters, live interest/budget edits, reasons and verification gaps; `/matches` remains an alias |
| `/universities/:programId` | Program details, sourced requirements, exams, documents, costs, deadlines and portfolio ideas                             |
| `/compare`                 | Compare two or three programs and choose a focus                                                                          |
| `/sign-in`                 | Optional nickname, no password, accepts everyone                                                                          |
| `/dashboard`               | One next action, progress and links to the six planning areas                                                             |
| `/my-list`                 | Save, relabel, filter or remove Dream, Priority, Backup and Considering options                                           |
| `/portfolio`               | Six activity categories, preferences, tailored ideas, custom activities, target periods and progress                      |
| `/exam-goals`              | SAT, IELTS, NUET and UNT (ENT) status, target score/date, and optional IELTS diagnostic section scores                    |
| `/roadmap`                 | Now / Prepare / Apply / Confirm steps, suggested timing, completion and expandable why/how/source details                 |
| `/sources`                 | Field-level sources, verification status, coverage and planning methodology                                               |

The diagnosis asks about grade, entry year, interest, city and city flexibility, annual tuition budget, funding, applicant category, academic strengths, exam statuses and extracurricular interests. Single-choice answers advance immediately; numeric and multiple-choice questions use Continue. The last answer saves the typed profile and opens university results immediately, with an editable summary above the results. Profile edits update matches and the roadmap when the answer is saved.

After the first results, **Continue to my dashboard** opens demo sign-in. Any nickname, including a blank one, is accepted; blank becomes “Student”. It does not create an account, check credentials or protect data. The local demo session survives reloads. Ending it preserves answers, saved options, goals and progress on that browser. There is no server authentication or cross-device identity.

Dream, Priority, Backup and Considering are personal organizational labels, never admission probabilities. Saved options outside a new hard city constraint remain visible with a warning, while comparison, focus and active roadmap tasks are reconciled to that constraint. Comparison remains available without demo sign-in.

Browser Back/Forward and refresh work with clean URLs. Direct links needing a profile or demo session explain the prerequisite. Unknown routes show a recovery screen. The interface includes keyboard focus, labeled inputs, a skip link, status announcements, reduced-motion support and responsive layouts.

## Architecture

```text
src/
  types.ts                   Strict domain and sourced-fact types
  data/universities.ts        Curated universities, programs and field-level provenance
  data/exams.ts              Official exam preparation links
  lib/matching.ts            Hard constraints, soft ranking and missing-data handling
  lib/roadmap.ts             Grade/year/list/activity/exam-sensitive task generation
  lib/profile.ts             Question order, score/date validation and JSON export
  lib/portfolio.ts           Category outcomes and grade/interest-sensitive activity ideas
  lib/persistence.ts         Validation, versioned state and relevance reconciliation
  lib/router.tsx             Small History API router and accessible internal links
  lib/admission.test.ts       Focused domain regression tests
  hooks/useAdmission.ts      State, persistence, themes and user actions
  components/                Shared UI and program cards
  pages/                     Diagnosis, search, details and planning screens
  styles/                    Existing visual system, planning layouts and both palettes
  App.tsx                    Shell, progress navigation and route composition
tests/journey.spec.ts         Browser acceptance tests
public/_redirects             Static-host SPA fallback
vercel.json                  Vercel SPA rewrite
server.mjs / Dockerfile      Optional existing container deployment
```

The `ApplicantProfile` interface in `src/types.ts` defines the visitor's JSON answers, strengths, activity preferences, current exam results, personal exam goals and IELTS practice section scores. The localStorage key is **`admission-journey-v3`**. Its versioned state also contains the draft, question progress, comparison/focus, saved university labels, planned activities, completed task IDs, theme and demo session. A valid `admission-journey-v2` profile is migrated with safe defaults for the new fields. The old fictional-catalog `vector-admission-v1` state is not migrated.

Missing storage starts a fresh diagnosis. Malformed JSON, invalid profiles and unsupported versions recover without crashing; valid saved profiles can survive a damaged draft. Blocked storage displays a warning and the app continues in memory. **Export my profile as JSON** downloads `admission-profile.json` containing a schema version, export time and the typed profile, including exam goals. This export is a profile snapshot, not a backup of activity/list/task state; there is no import feature. No personal data is sent to a server. Clearing browser storage removes local progress, and there is no cross-device synchronization. On a shared browser, demo sign-in does not separate different people's data.

Task IDs include relevant context and fingerprints of their inputs and sourced requirements. Reconciliation intersects completed IDs with regenerated tasks: changing an exam target resets affected exam work, removing a university/activity removes its tasks, and completing an activity replaces execution work with reflection. Unrelated edits preserve relevant completed work. A new option cannot inherit another program's completion. Changing a personal list label alone does not reset preparation.

## Rule-based recommendations

This app uses **rule-based recommendations**, not a model or server AI. It never calculates admission probabilities or guarantees scholarships.

1. Hard constraints enforce Kazakhstan, bachelor's level and a selected “Must stay in this city” preference.
2. Internal ordering prioritizes the student's interest and the program's editorial subject mapping, then city, verified affordability and recorded exam preparation. A future sourced exam minimum can be considered only for its verified cycle/category. Numeric sorting weights are internal; they are not displayed as a match score or chance.
3. Cards distinguish **Fits your verified budget**, **Needs verification** and **Over budget**. Verified affordability only describes tuition, not overall eligibility. Missing fees are never treated as zero. Grants never reduce tuition unless actually verified.
4. Completed and planned exams change explanations and preparation tasks. The current seed has no verified cycle-specific exam thresholds, so it does not assert exam eligibility. Research exam lists are possible topics/routes, not a requirement to take every exam.

Interest and budget controls in Universities recompute immediately. Individual diagnosis edits, saved list changes, saved exam goals and activity updates also regenerate results or relevant roadmap steps. Unknown results are `null`, not zero. AET completion is recorded without interpreting module scores; students are told to keep the official result for the admissions office.

Grades 9–10 start with field exploration and subject foundations. Senior students begin with checking the admission route. Future application tasks are explicitly for the intended intake. No official deadline is invented: unknown dates generate a task to verify the university's published calendar. Relative task timing is preparation guidance, not a confirmed deadline.

Portfolio Plan includes **Hackathons, Volunteering, Research, Personal Projects, Competitions and Leadership**, each with possible outcomes. Preferences order the suggestions; grade and interests adapt their scope. Students can add suggestions or custom activities, set a free-text target period and track Planned / In progress / Completed. Ideas are editorial suggestions, not evidence of admission success or claims that a portfolio is required.

Exam Goals supports SAT, IELTS, NUET and UNT (ENT) independently. Each goal has a current status/result and optional target score/date; use **Save goal** after editing. Not every exam applies to every university. Exam-specific roadmap steps appear for the student's selected preparation, plus clearly labeled route-verification tasks for saved programs. For example, IELTS preparation is split into a diagnostic, recording section scores, choosing one weak section, and scheduling two practice sessions. Practice estimates remain separate from official results. A personal target date never becomes an official exam date or university deadline.

## Official sources and limitations

Program pages were checked **16 September 2026**:

- [Nazarbayev University](https://apply.nu.edu.kz/): BSc in Computer Science; the university describes English-language study. Duration, tuition and intake-specific requirements remain unknown in this collection.
- [AITU bachelor's information](https://astanait.edu.kz/bachelor): program list, three-year study, English and listed **2,500,000 KZT for 2026–2027 only**. The price is conservatively scoped to the domestic route. It is not applied to international or unknown categories, or to 2027–2028 and later.
- [AITU Computer Science](https://astanait.edu.kz/en/Computer-Science-bachelor), [Software Engineering](https://astanait.edu.kz/en/Software-Engineering-bachelor), [Cybersecurity](https://astanait.edu.kz/en/Cybersecurity): official program references and subject mapping.
- [AITU admissions process](https://astanait.edu.kz/how-to-apply): UNT/AET research topics and application steps. The page's displayed thresholds and dates are not promoted to verified intake-specific facts because the applicable cycle/category was not established sufficiently for this record.
- [ENU Computer Engineering and Software](https://fit.enu.kz/en/page/departments/department-of-computer-and-software-engineering/educational-programs): 6B06104, four-year duration, software/computer systems and listed data/security subjects. Teaching language, tuition and admissions facts remain unknown.
- [Government university registry](https://data.egov.kz/datasets/view?index=onirler_oblystar_kalalar_boi11): a discovery source for institution names/addresses only; not used to substantiate admissions facts.

Exam preparation links checked **17 September 2026**: [College Board SAT practice](https://satsuite.collegeboard.org/practice), [IELTS preparation resources](https://ielts.org/take-a-test/preparation-resources), [NU admissions for NUET information](https://apply.nu.edu.kz/) and [National Testing Center for UNT (ENT)](https://testcenter.kz/en/). These are resources for the student's own preparation, not evidence that every program requires those exams.

Every changing fact has `value | null`, `status: verified | unknown | demo`, `sourceUrl`, `verifiedAt`, `admissionCycle`, and optional applicant `scope`. An inapplicable historical value is shown only as a labeled reference alongside “Check official site”. Program descriptions without an intake-specific cycle are labeled as checked descriptions; future availability must still be confirmed. There are no fabricated fees, grants or exact deadlines. The sample student answers and home preview are explicitly illustrative.

Coverage is intentionally limited to **three universities in Astana**, not all of Kazakhstan. Choosing another city as a hard constraint produces an honest empty state with an explicit option to relax that constraint. A larger budget does not resolve unknown prices. Recheck all admission facts before using the app for a real application. Local state is personal planning only; checking a task never submits an application or reserves a place.

The seed does not establish intake-specific admission thresholds, document lists, grants or deadlines, so those fields stay visibly unknown with official links. No public, verifiable admitted-student project examples are included. Program pages therefore show **portfolio project ideas** explicitly labeled as suggestions, without invented student identities or admission outcomes.

## Free editor workflow

1. Open the relevant university's official page and verify the exact program, applicant category and admission year.
2. Edit `src/data/universities.ts`. Keep IDs stable for existing programs and add a unique ID for a new one. Update only fields supported by that source, using field-specific URLs, the actual check date, intake and applicant scope. Keep `value: null` and `status: 'unknown'` when a fact is not confirmed. Document lists and exam requirements use the same sourced-fact structure. Mark any future fictional values `demo`.
3. Tuition uses KZT per academic year. If a deadline is added, use a complete ISO date/time with the confirmed timezone, for example an actual official timestamp with `+05:00`; never copy an old month/day into a new year. The current dataset deliberately has no dated deadlines.
4. Run `npm run typecheck`, `npm test` and `npm run build`; inspect the relevant card and Sources page. Run browser tests for changed journey behavior.
5. Commit the reviewed data and source changes to GitHub and redeploy `dist/` or trigger the connected host build.

A Google Sheet/CSV can be an editor's working copy, but its rows must be manually reviewed and transferred into the source file. **Repository TypeScript files are shared university data; each visitor's localStorage JSON is personal planning data. Editing a visitor profile does not modify university records or publish anything globally.** To update official exam resource links, edit `src/data/exams.ts`; to update editorial portfolio ideas, edit `src/lib/portfolio.ts` and keep them clearly distinct from sourced admissions facts. No scraper, admin dashboard or paid data API is included.

## Static deployment

Build command: `npm ci && npm run build`. Publish directory: `dist`. No environment variables are needed. Serve through HTTPS in production.

The History API router requires an SPA fallback: existing files must be served normally, and unmatched page paths such as `/roadmap` must serve `/index.html` with status 200. Missing assets should stay 404.

- **Netlify / Cloudflare Pages:** publish `dist`; Vite copies `public/_redirects` into the output. Check `/profile` directly after deploying.
- **Vercel:** use the included `vercel.json` rewrite; the Vite output directory is `dist`.
- **Nginx:** configure `try_files $uri $uri/ /index.html;` for page routes and a separate `/assets/` location with `try_files $uri =404;`.
- **Railway / containers:** the existing Dockerfile builds static assets and runs `server.mjs`; set the health check to `/health` and expose the platform-provided `PORT`. Express is only a static-file wrapper.
- **GitHub Pages:** clean History API routes do not work on refresh without an additional fallback strategy. Prefer a host above, or deliberately adapt the router and Vite base for a repository subpath before choosing Pages.

Hosting configuration is included; this update does not publish to a hosting account or push a GitHub repository automatically.

## Complete user walkthrough

1. Home → **Build my path**. Answer grade 11, entry 2027, Software engineering, Astana, flexible city preference, 3,000,000 KZT annual tuition budget, either funding option and Kazakhstan citizenship. Select strengths such as Mathematics and Programming. Use Back or reload midway to verify the draft resumes.
2. Record the separate exam statuses, for example UNT planned and IELTS completed; leave unfamiliar exams Unknown. Scores can be recorded later in Exam Goals. Choose Personal Projects and Hackathons. Click **Show my universities**. The sample path on Home is an optional shortcut with explicitly illustrative answers.
3. Results open immediately. Expand **Your saved diagnosis** to review or edit answers. Search by program name, filter by university and budget group, and open a card's **View program details**. Inspect sourced facts, verification gaps, official links and clearly labeled portfolio ideas.
4. Change interest to Cybersecurity: AITU's dedicated program rises to the top. Edit entry year or budget and observe the explanations change. For the seed's historical price demonstration, 2026 domestic tuition at AITU fits 3,000,000 KZT and exceeds 500,000 KZT; this does not imply that 2026 admissions remain open. A 2027 price stays unknown.
5. Save programs using Dream, Priority, Backup or Considering. Add two programs to comparison, open **Compare programs**, then **Choose a focus**. Comparison is independent of personal labels; selecting a focus also saves that option if needed.
6. Return to Universities → **Continue to my dashboard**. Enter any nickname or leave it blank → **Enter demo dashboard**. No password or real account is needed; previous answers, results and selections remain available. The dashboard shows one next action and all six planning areas.
7. Open **My University List**. Change a label, filter the list, or remove an option. Labels express your preferences, not your chances of admission.
8. Open **Portfolio Plan**. Review all six category outcomes, choose preferred categories, add a suggested or custom activity, set a target period such as “October 2026”, and change its progress to In progress. Younger grades receive smaller exploratory suggestions.
9. Open **Exam Goals**. For IELTS, enter your current official score if known (for example 6.5), set a target of 7.5 and your own target date, then **Save IELTS goal**. Optionally record diagnostic Listening, Reading, Writing and Speaking scores and save them. SAT, NUET and UNT goals are separate optional choices; check accepted routes before booking an exam.
10. Open **Roadmap**. Expand **Why this matters / How to do it / Source** on a task. Find the separate IELTS diagnostic, section-score, weak-section and practice steps. Complete a step and reload; it stays checked. Change the IELTS target to 8 and save: affected completion resets. Complete or remove an activity, or remove a saved option, and confirm obsolete tasks disappear.
11. Open **Profile** to review answers and exam goals. Use **Edit** beside one answer; saving returns to the summary and updates the plan. Download **Export my profile as JSON**. Editing grade to 9 and entry to 2029 makes field exploration the prominent next action.
12. For a coverage check, choose Almaty with “Must stay”. Results show an honest empty state; incompatible comparison/focus and active tasks are removed, while personal bookmarks show a constraint warning. Relax the city constraint to recover. Visit **Sources & data**, switch light/dark modes, and end the demo session: the local profile and plan remain saved.

## Third-party components

React and React DOM, TypeScript, Vite and its React plugin provide the frontend/build. Lucide React supplies icons. Manrope Variable is self-hosted through Fontsource. Vitest and Playwright supply tests; Prettier formats source files. Express serves the optional production container. The design, components, router, matching and roadmap rules are implemented in this repository; no external UI kit or AI integration is used.

## Submission preparation

The site and README are implemented here. The team still owns its GitHub publication, chosen hosting account, demo recording (up to three minutes), presentation (up to eight slides), final source review and submission. The supplied case brief states 19 September 2026 at 12:00 Astana time and case code `LOCUSCASE2`; verify the organizer's current instructions before submitting. Team identities and roles are not invented in this repository.
