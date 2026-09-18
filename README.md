# Locus frontend

React + TypeScript + Vite frontend for the existing LocusBackend project (`C:/Users/Amir/PycharmProjects/LocusBackend`).

## Сессии, ожидание и отмена

При открытии любого адреса приложение сначала проверяет `/auth/me`, затем загружает
профиль. До завершения проверки отображается общий экран ожидания: публичная главная
не мелькает. Действующая сессия на `/` ведёт в `/dashboard` (незавершённая анкета —
в `/diagnosis`). Гость видит главную; вход с защищённой прямой ссылки возвращает на
этот адрес. Сессия проверяется при возвращении в окно и раз в минуту; ответ 401
закрывает личные экраны. Несохранённые ответы остаются в памяти для повторного входа
в тот же аккаунт, а конфликт версий требует явного выбора серверной версии.
Обновление страницы до успешного сохранения по-прежнему требует осторожности:
браузер предупреждает о несохранённых изменениях. Сбой сети при проверке сессии
показывает ошибку с повторной попыткой, а не выдаёт пользователя за гостя.

`LoadingState` используется для поиска, анализа профиля и маршрута. `useOperation`
создаёт AbortController и UUID. API передаёт `X-Request-ID` и принимает NDJSON:
реальные события подготовки, модели, проверки формата и результата. Базовый маршрут
приходит первым событием `baseline`, ещё до готовности ИИ. Текст модели не показывается
частями до валидации, чтобы не выдавать непроверенные требования за факты.
«Прервать» закрывает запрос и отправляет `/ai/requests/{id}/cancel`; после этого
поздние ответы игнорируются. Анкета сохраняется независимо от отмены анализа.
На страницах профиля/подбора остаётся исходное содержимое; после анкеты отмена
возвращает к её последнему шагу. Ошибки имеют повторную попытку.

Маршрут впервые строится при открытии личного кабинета; включение ИИ использует
один запрос вместо прежних двух. Подбор и маршрут выполняются независимо;
сохранение профиля обязательно предшествует обоим. Подробности серверных логов
и защищённого режима отладки описаны в README **LocusBackend**. В development
консоль браузера выводит только UUID, этап и длительность, без ответов анкеты.
Блок результата содержит `data-request-id`: этот UUID совпадает с заголовком
сетевого запроса и серверными логами.

Проверки: `npm run typecheck`, `npm test`, `npm run build`. Полный путь с настоящим
PostgreSQL: `python scripts/test_locus_backend.py --backend C:/Users/Amir/PycharmProjects/LocusBackend --browser`.
Можно задать `PLAYWRIGHT_PORT`, если 3100 занят. Скрипт использует отдельный кластер
на 54329 и сервер на 8001, тестовые пользователи не попадают в рабочую базу.
Браузерные проверки покрывают desktop/iPhone, длинные названия, 40 шагов,
истёкшую сессию, прямые ссылки, отмену, поздний ответ, ошибки и повторный запуск.

Замеры 18.09.2026 на локальном каталоге и синтетической анкете, 6 программ:
медиана поиска 51,89 мс (5 запусков), подготовка шагов 4,65 мс. Контекст до сокращения
62 565 байт; после: маршрут 53 517, рекомендации 9 537, профиль 3 475 байт.
Внешний бесплатный AI остаётся главным источником ожидания: живая проверка анализа
профиля завершилась за 60 с без результата — Gemma/Qwen вернули 429, остальные
модели не ответили вовремя. Это отображается как недоступность, без выдуманного анализа.

## Обновление профиля, поиск и маршрут

Ответы сохраняются без размонтирования страницы. Подбор вузов фиксируется до нажатия
«Обновить подбор»: изменения профиля показывают подсказку об устаревшем подборе.
Текстовый поиск и восемь категорий работают по уже загруженным результатам.
«Подобрать с ИИ» добавляет персональные объяснения для шести лучших вариантов
через `/ai/recommendations`; проверка требований и ранжирование остаются на сервере.

Маршрут запрашивается отдельно через `/ai/roadmap` после сохранения анкеты
(задержка 900 мс после последнего изменения). Базовый русский маршрут доступен без
ИИ; «Дополнить маршрут с ИИ» включает подробные русские объяснения бесплатных моделей.
При ограничении бесплатного провайдера базовые инструкции остаются доступны.
Последующие изменения профиля обновляют включённые ИИ-советы в фоне.
Прокси и браузер допускают длительность AI-запроса до 70–75 секунд.

Личные экзаменационные цели создают шаги: пробный тест, запись результатов,
выбор слабого раздела и практика. Личная дата не является дедлайном университета.
Изменение экзамена сбрасывает отметки затронутых задач; остальные актуальные отметки
сохраняются. Завершить можно только первый незавершённый шаг. Возврат раннего шага
в «Запланировано» открывает заново последующие ручные отметки.
Кнопка «Текущая цель» показывает инструкции и позволяет отметить шаг.
В маршрут можно включить до шести программ. Отметки и выбранные программы пока
хранятся только в памяти текущего сеанса, как и до этого обновления.

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

`src/lib/profileSync.ts` serializes/coalesces questionnaire saves and handles revision conflicts. `src/hooks/useAdmission.ts` waits for saved answers before refreshing results. Search results remain visible until explicit refresh; account switches clear them. Roadmap refreshes separately and ignores outdated responses. Failed saves block refresh. Account identity is checked again before displaying results.

`src/lib/recommendations.ts` adapts server responses and merges optional AI coaching by program/task IDs. Admission facts and ranking remain server-owned. Personal exam tasks are shared across programs. The first unfinished task defines the next action; the status handler prevents skipping ahead. Selecting saved programs requests a new backend roadmap for those IDs.

Removed: local matching/ranking, local roadmap generation, personalized portfolio generation, the hardcoded university catalog, and unused localStorage migration logic. The frontend retains form validation, formatting, search/filter controls, comparison selection and other UI state. The existing visual style is retained, with shared loading blocks and responsive wrapping/touch targets.

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
