# Implementation Status — Windows XP Living Desktop (v0.4.5 current; v0.4.3/v0.4.4 historical)

## Implemented in this source revision

### Desktop shell and applications
- Rebuilt the web entry point around an XP Start Menu, taskbar/system tray, user header, local Bliss-style wallpaper asset, and app launch entries.
- Added desktop icon drag-position persistence and Luna Blue, Olive, Silver, and Classic theme selections.
- The v0.4.3 app list keeps the core desktop apps, Stickman Manager and Online Account & Sync. Standalone Animation Studio and My Drawings & Animations app surfaces are removed; creative assets are now reached through the Stickman profile.
- Added Paint canvas resize, fill, geometric tools, import, undo/redo, and PNG export controls.
- Preserved the Electron main/preload/WebContentsView architecture and the `legacy/` recovery files.

### Stickman runtime and creative tools
- Added one canonical action registry with legacy action aliases (`look` → `observe`, `wander` → `explore`) and validation.
- Added personality traits, needs, contextual emotion, utility-based action selection, goal bias, cooldowns, repetition penalty, deterministic variation, and a stable ID-based profile seed.
- Split desktop perception into a World Object Registry for icons, windows, tabs, bounds, visibility, z-index, pointer position, and bounded structural-event history.
- Added allowlisted Interaction API for launching simulated apps, focusing simulated windows, validated Paint strokes, and cosmetic effects on virtual browser tabs only.
- Added bounded per-character episodic/social/creative memory writes, basic social interaction/relationship counters, and persistence using IndexedDB.
- Added a validated vector Drawing DSL, SVG rendering/export, PNG export, generated sample artwork, and a local creative asset library.
- The retained animation engine creates per-character procedural keyframe projects. The former separate studio UI is no longer loaded.
- Added basic desktop/cursor following, exploration, avoidance, jumping, social greeting, creating artwork, and window/icon/tab interaction behavior. The simulation does not manipulate the host OS cursor or real browser tabs.

### Backend and deploy configuration
- Added a Node.js 22 same-origin static + API server, `/health` process liveness, and `/ready` database readiness.
- Added Drizzle PostgreSQL schema and initial SQL migration for users, sessions, desktop settings, characters, memories, relationships, goals, animation projects, and drawing assets.
- Added Neon runtime pooled connection support, unpooled migration preference, Argon2id registration/login, HMAC-SHA256 session-token hashes keyed by a 32-byte-minimum `SESSION_SECRET`, HttpOnly/SameSite cookies, request limits, same-origin write checks, transactions, and user-ownership validation.
- Added REST cloud-sync endpoints, IndexedDB sync outbox/retry, cached non-secret account profile for reconnecting after offline periods, and local-first operation without a database.
- Replaced static-only Nginx runtime with a Node 22 Docker multi-stage runtime that builds Rust/WASM and serves frontend + API together; retained the old Nginx template as a legacy/reference artifact.
- Added a dependency-free Node 22 `.env` loader for server/migration/Drizzle entry points (without overriding platform-injected variables), `.env.example`, `.gitignore`, `.dockerignore`, Drizzle config, migration runner, and deployment documentation.

### Rust/WASM
- Aligned Rust action suggestions to canonical action names.
- Made Rust seed generation depend on immutable character ID, matching the JavaScript fallback's deterministic seed rule.
- Aligned Rust motion integration constants with the JavaScript fallback.
- Added a dynamic WASM adapter that uses generated bindings when they load and falls back to JavaScript if they are absent or fail.

## Checks run in this environment

| Check | Result | Notes |
|---|---|---|
| `npm run check` | PASS | Node syntax checks across main, server, desktop and modules |
| `npm test` | PASS | Source smoke tests, action/AI/drawing/animation tests, `.env` precedence and sync timestamp guards, Electron IPC mocks, web adapter tests, HTTP server/health checks |
| Standalone Node web server | PASS | `/health`, desktop HTML, adapter asset, and 404 behavior exercised |
| `npm install` | BLOCKED | npm registry network lookup failed with `EAI_AGAIN`; dependencies not installed |
| `npm run test:rust` | NOT RUN | Cargo/Rust are not installed in this environment |
| `npm run build:wasm` | NOT RUN | Cargo/Rust/wasm-pack are not installed |
| `docker build .` | NOT RUN | Docker is not installed |
| Neon integration / migration | NOT VERIFIED | No live `DATABASE_URL` or `DATABASE_URL_UNPOOLED` supplied |
| SnapDeploy live deployment | NOT VERIFIED | No connected repository/deploy credentials available |
| Visual E2E across 1024×768 through mobile | NOT VERIFIED | Headless Chromium did not complete in this container (D-Bus/zygote startup issues); viewport-specific acceptance remains outstanding |

## Remaining / partial scope (do not treat as complete)

- Advanced stickman choreography remains partial: the action vocabulary covers the requested states, but not every state has a bespoke full animation/action executor or multi-step cinematic sequence.
- Relationship modelling and memory are currently lightweight local counters plus bounded event memories; sophisticated consolidation, cross-session social inference, summary memories, and deep retrieval are not complete.
- The animation engine is a lightweight pose/keyframe system, not a full skeletal animation package with a curve editor, IK, or independent editable vector layers.
- Neon/Drizzle schema and API are implemented in source, but real database transaction/auth/IDOR/sync tests must still run after dependencies are installed and Neon credentials are configured.
- Rust/WASM and Docker paths are configured but remain uncompiled/unbuilt in this environment.
- SnapDeploy/GitHub are documented deployment targets; no production deployment has been performed.
- No hosted LLM, real-time multiplayer, remote desktop control, or real-browser-tab manipulation is included.


## v0.4.2 — SnapDeploy Small build-stage fix

- Dockerfile reduced from three stages to exactly two (`production-deps`, `production`).
- Rust/wasm-pack installation and WASM compilation removed from the constrained image build.
- The application retains its JavaScript fallback when optional WASM artifacts are absent.
- Production image still installs production Node dependencies and serves the desktop/API on the platform-provided port (default 8080).
- This source change does not itself verify a remote SnapDeploy build; deploy logs and `/health` still need confirmation.


## v0.4.3 — Paint / appearance / autonomous animation / browser fixes

### Integrated changes
- Paint includes explicit **Tạo Stickman** and **Chỉnh Stickman…** actions. New character creation writes a structured profile, then deliberately draws the created character onto the active Paint canvas with an undo snapshot. Editing changes profile metadata only; it does not overwrite Paint images.
- Added `ui/modules/stickman-appearance.js`, a deterministic allow-listed appearance schema with head, skin, hair, clothing, color, accessory and expression settings. The optimizer reads/writes only this schema.
- `XPAnimation.draw` now receives each character's profile appearance in the autonomous desktop renderer. The rename path preserves appearance metadata. Existing character selectors refresh after IndexedDB restoration.
- New Stickmen automatically receive an individual personality/trait-driven keyframe project. The profile can explicitly regenerate an animation and preview it without a separate Studio app.
- Fixed missing AI need defaults so absent keys no longer normalize to zero. Goal progression now updates the visible short-term goal; recalled social/creative memories influence scoring.
- Web adapter URL detection now distinguishes single/multi-word search queries from domain/local URLs. Added forced search and provider selection in the simulated Internet Explorer UI.
- Removed the animation studio module loader/file and dead studio CSS; removed obsolete interaction allow-list app IDs. The old drawing/animation library remains accessible inside character profiles, not as its own application.

### Architecture and persistence
- Neon PostgreSQL remains the cloud backend, accessed only by the Node API. Appearance is added inside the existing `characters.profile` JSONB object, so this change does not require a SQL migration.
- Generated animations use the existing animation-project table and join the account's normal sync snapshot. Local-first IndexedDB behavior is retained.
- SnapDeploy Small remains configured for the two-stage Node 22 Docker image and default port 8080. Use private runtime variables `DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (migration/direct), and `SESSION_SECRET`; run `npm run db:migrate` as a release task.

### Verification
- `npm run check`: PASS.
- `npm test`: PASS, including new appearance validation, generated keyframe, AI-default and web-search adapter regression tests.
- Live Neon login/migration/sync: NOT VERIFIED (no connection secret supplied).
- SnapDeploy image build / live health checks: NOT VERIFIED (no deployment access in this environment).
- Visual acceptance across real browsers and screen sizes: NOT VERIFIED.

### Known limitations / next recommended work
- The appearance optimizer is intentionally metadata-only. It does not use computer vision to infer a Stickman from imported raster art; this avoids accidental edits to ordinary photos or unrelated Paint images. A future image-to-character feature should require explicit selection/cropping and a separate non-destructive preview/confirm step.
- Animation generation uses a finite pose vocabulary and interpolated keyframes, not learned motion capture, inverse kinematics, or a full graph editor.
- The AI brain is a deterministic utility planner with bounded event memories; it is not a hosted LLM or sentient model. A deeper next step is memory summarization, long-term retrieval, explainable multi-step goals, and per-character action outcome learning.
- Cloud sync remains user/account initiated, with queued offline snapshots retried when connectivity returns; automatic real-time sync on every local mutation is not implemented.
- In web hosting, external pages may reject iframe embedding through their own CSP or X-Frame-Options. Use **Mở ngoài** for those sites.

## v0.4.4 — Paint drawing mode, central AI, articulated rig and XP updates

### Paint / Stickman authoring
- Replaced the Paint creation dialog entry point with **Chế độ vẽ Stickman** and an isolated transparent draft canvas. Only fresh strokes captured in this mode are smoothed and saved; imported images and pre-existing Paint pixels are not inspected.
- Added drawing validation (stroke/point caps, bounds, length), Chaikin smoothing and consistent stroke width. The user explicitly chooses **Hoàn tất & Tự làm đẹp** before the character is created and committed to the main canvas.
- Creation is atomic with respect to Paint: the draft is not committed to the canvas until the new character/mind has been created successfully. Vector sketch is attached to the character profile.

### Appearance / animation
- Reworked the preview renderer to use a consistent downward-angle coordinate system, upper/lower limb joints and grounded left/right foot anchors; increased and recentered the appearance preview.
- Added safe fallback choreography when the model does not return enough motion frames. Model keyframes and joint angles are validated before being passed to the animation rig.
- Existing appearance editor remains for editing characters; rename/appearance updates preserve mind identity and memories.

### Per-character AI and multi-Neon memory
- Added a unique per-character mind identity with seed, values, preferences/action counts, relationships, disposition, experience history and long-term summary.
- Added server-side OpenAI-compatible model adapter with authenticated `/api/v1/ai/status` and `/api/v1/ai/think` routes. Model keys remain on the server; each request contains one character's context and is ownership-checked.
- Server validates actions, emotions, learning deltas and motion plans; missing animation receives a local safe fallback. Model can be left unconfigured, in which case local planner remains active.
- Added `server/ai-store.js` with lazy AI table creation and `AI_DATABASE_URLS` deterministic character-ID sharding across up to 8 Neon databases. Main `DATABASE_URL` remains required for account/auth/character ownership.

### Windows XP experience / browser
- Expanded Control Panel settings: XP themes, wallpaper, icons, Quick Launch, taskbar lock, simulated sounds, pointer style, clock/date and supported resolution controls.
- Browser supports tabs/history/bookmarks/search engines and open-external fallback. In hosted web mode, third-party iframe restrictions remain enforced by those sites; Electron uses WebContentsView.

### Verification boundaries
- `npm run check`: PASS.
- `npm test`: PASS, including a mocked OpenAI-compatible request/response through the real server adapter.
- Live AI provider, Neon, Docker, Rust/WASM and SnapDeploy were not verified because the required private credentials/toolchains/deployment access were unavailable.
- A headless Chromium screenshot pass did not complete in the tool environment; real-browser visual acceptance remains required after deployment.
- Multiple Neon URLs must retain a stable order and count; this release does not rebalance existing mind data when the shard set changes.


## v0.4.5 — llama.cpp local inference integration

- Added no-paid-token `AI_BACKEND=llama.cpp` adapter and optional native llama-server process lifecycle.
- Added official llama.cpp server Docker Compose stack with private internal inference port and read-only GGUF model mount.
- Local results now pass the same memory/learning persistence path as remote model results.
- AI status reports backend, token requirement, process state and model health.
- Added llama.cpp regression tests; `npm run check` and `npm test` pass.
- Neon mind sharding remains 1–8 configured databases. SnapDeploy Small should host Node/Neon only; use a private inference host for the model.
