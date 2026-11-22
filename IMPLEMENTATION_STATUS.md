# Implementation status — Windows XP Living Desktop 0.3.0

## 1. New web/SnapDeploy target

- Added a browser-host adapter. Electron mode keeps the secure `xpHost` preload bridge; web mode gets browser-only file and browser-tab APIs without Node.js or OS access.
- `npm start` now starts a native Node static server on `0.0.0.0:$PORT` (default `8080`); `/health` returns HTTP 200.
- Added a multi-stage SnapDeploy `Dockerfile`: compile the Rust crate to WebAssembly, copy the existing renderer files, and serve them with Nginx.
- Added an Nginx configuration template that listens on the environment-provided `PORT`, defaulting to `8080`, plus a container health check.
- Existing Electron launch remains available as `npm run electron`.

## 2. Rust migration

Moved portable simulation logic into `rust-core/src/lib.rs` and exposed it through `wasm-bindgen`:

| Rust function | Responsibility | Browser integration |
|---|---|---|
| `stable_hash` | Stable FNV-1a hash over UTF-16 code units | Character identity and ability seeds |
| `random_values` | Deterministic xorshift32 sequence | Ability selection and personality traits |
| `choose_action` | Utility scoring with previous-action avoidance | Stickman AI planner |
| `integrate_motion` | Gravity, friction, follow/wander forces, bounds and floor collision | Stickman runtime physics |

The JS implementation remains as a deterministic fallback when the WASM bundle has not been built. JS fallback and Rust use the same seed/hash algorithm; a parity test pins a known Unicode seed.

The DOM, Canvas, WindowManager, browser file APIs and IndexedDB remain JS. Migrating these to Rust would add bridging complexity without improving the browser API boundary. This is a Rust/WebAssembly compute core, not a Rust HTTP backend.

## 3. Web behavior changes

- Notepad uses browser File System Access pickers where available, with file-input/download fallback.
- Browser tabs in web mode use sandboxed iframe elements. HTTP/HTTPS navigation is allowed; non-web schemes are never executed as iframe URLs.
- The IE toolbar has **Mở ngoài** for sites that disallow iframe embedding.
- File access remains user-selected; no silent computer-wide scan is introduced.
- Browser and character data continue to be stored locally with IndexedDB/localStorage.

## 4. Retained functionality

The original eight files remain in `legacy/`. The integrated Electron target still includes one desktop BrowserWindow, isolated preload, IPC allowlist and Electron WebContentsView. Existing mini-apps, WindowManager, context menus, stickman runtime and storage manager remain in the shared UI code.

## 5. Checks executed in this environment

- `npm run check` — passed JavaScript syntax checks for Electron, web adapter, renderer and modules.
- `npm test` — passed static/source smoke tests, Electron main-process mock tests, web-adapter lifecycle/protocol tests and local static-server health/asset/404 tests.
- Local web server smoke test verified `GET /health`, `GET /`, `GET /host-adapter.js`, and unknown-path `404`.

## 6. Not verified here / limitations

- This environment has no `rustc`, `cargo`, `wasm-pack` or Docker. Rust unit tests, `wasm-pack build`, and the multi-stage Docker build were not executed here. Run `cargo test --manifest-path rust-core/Cargo.toml` and inspect the first SnapDeploy Docker build logs.
- A headless Chromium/Playwright attempt could not navigate to the local server (`ERR_BLOCKED_BY_ADMINISTRATOR` in this environment), so there is no verified rendered-browser UI result. No cross-browser test or actual SnapDeploy deployment was performed.
- Iframe navigation cannot bypass a website's `X-Frame-Options` or CSP `frame-ancestors`; those sites need to be opened in the visitor's normal browser tab.
- Web File System Access API support varies by browser and generally requires HTTPS or localhost. Other browsers use import/download fallbacks.
- Data is not synchronized across devices. There is no server database or login system.
- Animation Studio, advanced skeleton editing, window/icon collision physics, particle destruction, full filesystem operations and the rest of the incomplete 0.2.0 items remain unfinished.
