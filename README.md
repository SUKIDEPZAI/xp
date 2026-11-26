# Windows XP Living Desktop — Autonomous Stickman Ultimate (v0.4.5)

A browser-first Windows XP Luna desktop simulation with local applications, autonomous 2D Stickmen, Paint-only character drawing, automatic appearance refinement, an articulated animation rig, per-character AI identities, a built-in llama.cpp local-inference adapter, and Neon PostgreSQL memory sharding. The Electron shell remains available for local desktop use.

When llama.cpp is configured, Stickmen send each character’s identity, traits, needs, memories, relationships and world context to the private local inference server; no paid API token is required. The local rules-based planner remains the fallback if inference is not configured or unavailable. Each character has a persistent mind record and independent memory stream; the model provider itself is shared, not a separate model process for every character. This is an agent simulation, not a claim of consciousness.

## Requirements

- Node.js 22 or newer.
- npm.
- For accounts/cloud sync: a Neon PostgreSQL database and the environment variables below.
- For the Rust/WASM build: Rust toolchain, `wasm32-unknown-unknown`, and `wasm-pack`.
- For container deployment: Docker-compatible image build support (SnapDeploy can build the repository Dockerfile).

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080`. The server binds to `0.0.0.0` and reads the injected `PORT`; it defaults to `8080`. The desktop and `/api/v1/*` endpoints share one origin. Without a database configured, the desktop and IndexedDB-only mode still run; account and cloud endpoints return `503 database_not_configured` rather than pretending that sync is active.

For local database-backed development, copy `.env.example` to `.env`, replace the example values with your Neon values, then start the server. The Node entry points load this root `.env` file automatically without an extra package; variables already injected by your shell or hosting platform are never overwritten. Never commit `.env` or put either database URL or `SESSION_SECRET` in browser code. `SESSION_SECRET` must be a random value of at least 32 bytes. The API stores only an HMAC-SHA256 hash of each random opaque session token in PostgreSQL; the raw token is returned only as an HttpOnly cookie.

## Neon PostgreSQL setup

1. Create a Neon project and database.
2. Copy the pooled connection string into `DATABASE_URL`. Neon pooled hosts normally include `-pooler`; use this for application traffic.
3. Copy the direct/unpooled connection string into `DATABASE_URL_UNPOOLED`. Use it for schema migration/maintenance tasks.
4. Generate a session secret (do not reuse a database password), then set `NODE_ENV=development` locally or `production` behind HTTPS. For example:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Put the generated value in the `SESSION_SECRET` entry in your untracked `.env` file or the platform's private runtime settings.

5. Install dependencies and apply the checked-in migration:

   ```bash
   npm install
   npm run db:migrate
   ```

6. Start the service and verify:
   - `GET /health` — process liveness; remains healthy even if Neon is not configured.
   - `GET /ready` — readiness; returns `200` only when PostgreSQL accepts a query.
   - `GET /api/v1/health` — API and database status.

The migration runner uses `DATABASE_URL_UNPOOLED` when present, otherwise `DATABASE_URL`. It records applied migration IDs in `schema_migrations` and runs each migration in a transaction. Do not use `drizzle-kit push` as an ad-hoc production migration mechanism. `drizzle-kit generate` is available for generating future SQL migrations after schema changes.

### API surface

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `GET|PUT /api/v1/desktop/settings`
- `GET|POST /api/v1/characters`, `GET|PUT|DELETE /api/v1/characters/:id`
- `GET /api/v1/characters/:id/memories`, `GET /api/v1/characters/:id/relationships`
- `GET|POST /api/v1/animations`, `PUT|DELETE /api/v1/animations/:id`
- `GET|POST /api/v1/drawings`, `PUT|DELETE /api/v1/drawings/:id`
- `GET|POST /api/v1/sync`
- `GET /api/v1/ai/status`, `POST /api/v1/ai/think` (authenticated per-character AI gateway)
- `GET /api/v1/health`, `GET /api/v1/ready`

Passwords are hashed with Argon2id. The API sets an HttpOnly, SameSite=Strict session cookie (Secure in production), stores only an HMAC-SHA256 token hash keyed by `SESSION_SECRET`, rate-limits API routes, limits request size, checks same-origin writes, and filters every user-owned resource by the authenticated user. The sync transaction validates character ownership before accepting related memories, goals, relationships, drawings, and animations. The client stores its session only as a browser cookie; the cached account profile contains no credential.

Cloud Sync uses IndexedDB as an offline cache/outbox and applies a last-write-wins policy using `updatedAt`. If a previously authenticated user goes offline, a manual sync snapshot is queued and retried on the next online event. Local-only data remains available without an account. The browser does not upload Notepad text, passwords typed into Notepad, or browser page contents.

## Local AI with llama.cpp (no paid API tokens)

The server supports `llama.cpp` directly through its `llama-server` OpenAI-compatible chat endpoint. Model weights run on the inference machine and are not included in this source archive. Node and Neon keep each Stickman's mind separate; llama.cpp provides the shared inference engine.

### Option A — Docker Compose app + inference

1. Install Docker Compose on a machine with enough RAM/CPU or supported GPU for your GGUF model.
2. Create `models/` beside `docker-compose.llama.yml` and put your model file there as `model.gguf` (or set `LLAMA_CPP_MODEL_FILE` in your private `.env`). Review the model's license and choose a quantization that fits available memory.
3. Copy `.env.example` to `.env`, then set Neon `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, and optionally `AI_DATABASE_URLS`.
4. Run `docker compose -f docker-compose.llama.yml up --build`.
5. Open `http://localhost:8080`. Node reaches the inference service at `http://llama:8080/v1`; that port is not published to the public host.

This uses the official `ghcr.io/ggml-org/llama.cpp:server` image and a read-only model mount. Upstream docs: [llama-server API](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md), [Docker](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md).

### Option B — native llama-server beside Node

Install/build `llama-server` and place a GGUF model on the same host. Set `AI_BACKEND=llama.cpp`, `LLAMA_CPP_AUTOSTART=true`, `LLAMA_CPP_BIN=/path/to/llama-server`, and `LLAMA_CPP_MODEL_PATH=/path/to/model.gguf`. Set `LLAMA_CPP_BASE_URL=http://127.0.0.1:9931/v1`, `LLAMA_CPP_MODEL=local-model`, and tune `LLAMA_CPP_CTX_SIZE`, `LLAMA_CPP_THREADS`, `LLAMA_CPP_PARALLEL`, `LLAMA_CPP_TIMEOUT_MS` and `LLAMA_CPP_MAX_TOKENS`. The Node server starts/stops the native process; model and binary must already exist.

### Option C — SnapDeploy app + private inference host

Keep the Node/Neon app on SnapDeploy and run llama.cpp on a separate private inference host with sufficient memory. Set `AI_BACKEND=llama.cpp` and `LLAMA_CPP_BASE_URL=https://YOUR-PRIVATE-INFERENCE-HOST/v1` in private server settings. For HTTP on a trusted private network only, set `LLAMA_CPP_ALLOW_INSECURE_HTTP=true`. If the inference server uses a key, set `LLAMA_CPP_API_KEY` privately on the app and configure the matching `LLAMA_API_KEY` on llama-server.

**Resource note:** SnapDeploy Small's 512 MB app container is suitable for Node/Neon, not for loading most GGUF models plus context. Multiple Neon databases increase memory-storage/shard capacity, not inference RAM or GPU. For an all-in-one deployment, the inference host must have enough memory for model weights, KV context and runtime overhead.

`GET /api/v1/ai/status` reports backend, model label, whether a paid API token is required, native process state and llama-server `/health` readiness. `AI_DATABASE_URLS` remains supported for 1–8 Neon shards; keep shard count/order stable unless performing a planned data rebalance.

## Rust / WebAssembly

The browser dynamically attempts to load `ui/wasm-core/xp_core.js`. If generated bindings are absent or fail to initialize, the JavaScript fallback remains active. To build the WASM module locally:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run build:wasm
```

The Rust crate includes:

- `stable_hash`: deterministic FNV-1a seed based on immutable character ID (renaming does not reroll the profile).
- `random_values`: deterministic xorshift32 profile values.
- `choose_action`: a small canonical-action suggestion used as a low-weight hint to the richer JavaScript utility planner.
- `integrate_motion`: the 2D virtual-character movement integration step.

Run Rust unit tests with `npm run test:rust`. The web renderer, Canvas, DOM, IndexedDB, event registry, AI utility scoring, drawing, and animation remain JavaScript.

## SnapDeploy deployment

The repository Dockerfile is the production entry point and uses exactly two build stages: production Node dependencies, then the Node 22 runtime. To stay within SnapDeploy Small's build-stage limit and memory/disk budget, it does not install Rust or compile WASM during deployment. The browser uses its built-in JavaScript fallback; WASM remains an optional separate build (`npm run build:wasm`) that can be performed outside the constrained container and included in `ui/wasm-core/`.

1. Push this repository (including `Dockerfile`, `server/`, `migrations/`, `scripts/`, `rust-core/`, and `ui/`) to GitHub.
2. In SnapDeploy, connect the repository and select the deployment branch. Use the repository root as the build context and choose Dockerfile deployment.
3. Configure these as **private runtime environment variables** in SnapDeploy:
   - `NODE_ENV=production`
   - `DATABASE_URL` — Neon pooled connection string
   - `DATABASE_URL_UNPOOLED` — direct connection string used for migration tasks
   - `SESSION_SECRET` — random secret (at least 32 bytes) used to HMAC session tokens; generate it locally and do not reuse the database password
4. Run `npm run db:migrate` as a release/one-off task against the configured Neon database before enabling accounts, or execute it from a trusted administrative environment with the same private variables.
5. Deploy the Dockerfile. The app binds to `0.0.0.0` and uses the platform-provided `PORT` (defaulting to `8080` locally). Configure the platform readiness/health check to use `/ready` when you want database-dependent traffic gating; use `/health` for process liveness.
6. Inspect build/runtime logs, verify `/health` and `/ready`, then create a test account and run a sync round trip.

The service uses ordinary HTTP/REST requests and reconnect-on-online sync; it does not require a permanently open WebSocket. On sleep-capable/free hosting, the first request after an idle period may incur a cold start. A live deployment, GitHub connection, Neon migration, and production credentials are intentionally not claimed from this source-editing environment.

## Electron desktop edition

```bash
npm install
npm run electron
```

Electron continues to use the isolated preload bridge (`contextIsolation`, sandbox, no renderer Node integration) and the existing WebContentsView implementation. The web version cannot control the host operating system's cursor, inspect the user's files silently, or close tabs in the real browser; these interactions are limited to the simulated desktop and virtual Internet Explorer.

## Included desktop applications and features

- XP Luna-style desktop, Start Menu, taskbar, resizable windows, context menus, desktop icon layout persistence, and Luna Blue / Olive / Silver / Classic themes.
- My Computer, My Documents, Recycle Bin, Internet Explorer simulation, Paint, Notepad, Calculator, Minesweeper, Solitaire, Media Player, Control Panel, Search, Help, Run, Stickman Manager, and Online Account & Sync. Creative assets are shown in each Stickman profile; no separate Animation Studio or My Drawings & Animations app is loaded.
- Paint supports pen/brush/eraser, line, rectangle, circle, fill, undo/redo, import, canvas resize, and PNG export.
- Stickmen use one action registry, per-character trait/need profiles, utility scoring, cooldown/repetition controls, basic physics, pointer/window/icon perception, safe allowlisted desktop interactions, social greeting/relationship counters, bounded episodic memories, and locally stored creative output.
- Drawing assets are validated vector command documents and can export SVG/PNG/JSON. Each new Stickman receives a deterministic, personality- and trait-driven keyframe animation. Generated animations can be previewed from the Stickman profile.
- IndexedDB stores characters, memories, drawings, animation projects, settings, and pending sync snapshots.

## Tests and known verification limits

```bash
npm run check
npm test
npm run test:rust
npm run build:wasm
```

`npm run check` validates JavaScript syntax. `npm test` runs repository smoke tests, action/personality/memory checks, drawing DSL validation and SVG escaping, animation project validation/interpolation, basic security invariants, Electron bridge mocks, and standalone HTTP server / readiness / no-database fail-closed checks.

In the environment used to prepare this handoff:

- `npm run check`: PASS.
- `npm test`: PASS.
- JavaScript fallback and no-database web server: exercised by smoke tests.
- `npm install`: not completed because npm registry DNS/network requests failed (`EAI_AGAIN`); dependencies therefore were not installed in this environment.
- `npm run test:rust` / `npm run build:wasm`: NOT RUN — Cargo/Rust/wasm-pack are not installed.
- `docker build .`: NOT RUN — Docker is not installed.
- Neon migration, account registration/login against a real database, cloud sync across separate accounts/devices, SnapDeploy deployment, and visual browser E2E at the requested viewport sizes: NOT VERIFIED — no live Neon credentials, deployment credentials, browser automation suite, or Docker runtime were available.

The tests are meaningful source/runtime smoke tests, not proof that every requested end-to-end workflow or every viewport has passed. The autonomous action vocabulary is unified, but some advanced states from the full brief (for example full-body grab/drag/push/pull/hang choreography and highly scripted multi-step tab scenes) remain partial rather than finished production animation systems.

## SnapDeploy port configuration

This project must listen on an unprivileged container port. Set the SnapDeploy container/listener port to `8080` and use `npm start`. The server binds to `0.0.0.0` and reads the platform-provided `PORT`; it exits early with an actionable message if `PORT` is below `1024` (for example, `80`). Do not configure the Node process to listen on port `80`. Deploy version `0.4.5` or later. The Node image uses two Docker stages, and startup logs should identify `windows-xp-living-desktop@0.4.5`.



## v0.4.3 — Paint-first Stickman workflow (superseded in v0.4.4)

- Removed the standalone Animation Studio loader/module and old studio-only UI styling. Removed the standalone artwork-library app from the documented app set; drawings and animation projects are surfaced inside each character profile instead.
- In v0.4.3, Paint used a create-character control and an appearance selector. v0.4.4 supersedes the creation control with **Chế độ vẽ Stickman** on a separate draft layer; the existing appearance editor remains available for already-created characters.
- The appearance editor adds head shape, skin tone, hair style/color, clothing/style color, accessories, expression, accent color, and a live preview. **Tối ưu ngoại hình** deterministically refines only the selected Stickman's structured appearance profile. It does not scan, classify, or rewrite any imported image or other Paint pixels.
- Appearance is stored under `character.profile.appearance`, rendered by the desktop character renderer, and preserved in the existing PostgreSQL `profile jsonb` column. No database migration is required for this additive profile field.
- New Stickmen receive an automatically generated multi-keyframe animation based on personality and selected traits. A separate **Tạo animation** action is available from the profile. Projects remain in IndexedDB and join the normal authenticated cloud-sync snapshot.
- AI planner fixes include sensible initial needs rather than all-zero defaults, goal lifecycle progression, and memory-category cues for social and creative decisions. Renaming a character now preserves appearance.
- The web browser adapter now matches Electron URL/search detection: single words and phrases are search queries, hostnames/local addresses remain navigations, and an explicit **Tìm** action forces search. Google, Bing and DuckDuckGo can be selected.

## v0.4.3 — Verification boundaries (historical)

`npm run check` and `npm test` pass in the source-editing environment. They cover syntax, appearance model validation, generated animation keyframes, AI need defaults, browser query routing, Electron IPC mocks, HTTP readiness and mocked llama.cpp requests. Live Neon credentials and a SnapDeploy deployment were not available here; see `UPGRADE_REPORT.md` for the verification checklist and remaining limitations.


## v0.4.4 — Per-Stickman AI, drawing workflow and animation rig

### Paint-first character creation

1. Open **Paint** and choose **Chế độ vẽ Stickman**. This creates a dedicated, transparent draft layer separate from the existing Paint canvas.
2. Draw the character using at least three clear strokes. Only the strokes captured in this mode are sent to the smoothing / vector-save module.
3. Choose **Hoàn tất & Tự làm đẹp**. The app validates the draft, smooths its lines, generates a profile appearance and creates the character's individual mind record. The composite is committed to the Paint canvas only after character creation succeeds.
4. Imported images, existing canvas pixels, and ordinary Paint strokes are never scanned or passed to the Stickman beautifier. The user must explicitly start and finish Stickman drawing mode.

The appearance editor remains available from a character profile or Paint's **Chỉnh ngoại hình** selector. Updating appearance does not reset the mind or erase memories.

### Central AI brain server

- `GET /api/v1/ai/status` reports whether a server-side model adapter is configured.
- `POST /api/v1/ai/think` is authenticated and owner-scoped. It accepts one character's bounded profile, needs, mind, memories and world context.
- `server/ai-orchestrator.js` calls an OpenAI-compatible Chat Completions endpoint. It validates the returned action, emotion, learning deltas and animation motion plan before the renderer receives them. No API key is sent to the browser.
- Each Stickman has a stable `mind ID`, seed, values, preferences, relationships, evolving disposition, long-term summary and bounded experience history. The same model can serve many Stickmen while their context and stored minds remain independent. The model is not a separately trained model per character.
- In v0.4.5, `AI_BACKEND=llama.cpp` activates local inference without a paid API key. Set `LLAMA_CPP_BASE_URL` to the private llama-server `/v1` base URL; `LLAMA_CPP_MODEL` should match its alias.
- The legacy OpenAI-compatible provider remains optional and requires `AI_API_KEY`, `AI_MODEL`, and `AI_API_URL` or `AI_API_BASE_URL`; it is not used when `AI_BACKEND=llama.cpp`. Keep keys in private server settings, never frontend code.

### Multiple Neon memory shards

`AI_DATABASE_URLS` may contain a JSON array of 1–8 pooled Neon connection strings. The AI store uses a deterministic FNV hash of the immutable character ID modulo the configured list length to select one shard. If absent, `AI_DATABASE_URL` is used, then `DATABASE_URL`. The primary `DATABASE_URL` is still required for user accounts, ownership checks and the main character profile.

```env
AI_DATABASE_URLS=["postgresql://...neon-shard-a-pooler...","postgresql://...neon-shard-b-pooler..."]
```

AI tables and indexes are created lazily on each selected shard; the normal account schema migration remains on the primary database. Keep the shard list, ordering and count stable after deployment. Changing the array can remap character IDs and requires a planned data rebalance; this release does not automatically copy existing shard data. Multi-Neon support is sharding, not automatic failover or replication.

### Animation v2

The runtime uses an articulated two-segment limb rig, bounded joint angles, personality-aware sequences, 24 FPS projects and smooth interpolation. Model-generated plans pass through a separate validator and are converted into rig keyframes. If a model omits or returns too few frames, a bounded idle → anticipation → action → settle sequence is generated locally instead of rendering an incomplete animation.

### Windows XP desktop and Internet Explorer

The Control Panel now manages Luna / Olive / Silver / Classic themes, wallpaper, desktop icons, Quick Launch, taskbar locking, simulated system sounds, pointer style, clock/date and supported display settings. In hosted browser mode, Internet Explorer uses isolated iframes and provides tabs, history, bookmarks, search engines and **Mở ngoài**. Some sites intentionally block iframe embedding (CSP / X-Frame-Options); the hosted page cannot override those site policies, so use **Mở ngoài** to view them in the real browser. In Electron, the app uses `WebContentsView` for actual browser rendering.

### v0.4.4 verification

Run:

```bash
npm run check
npm test
```

The AI service test uses a mocked OpenAI-compatible endpoint to exercise the actual server adapter without requiring a real provider key. It verifies authorization header construction, character-specific context and validated motion plans. This does not prove a live provider or Neon deployment is reachable. See `UPGRADE_REPORT.md` for known boundaries and the release checklist.
