# Windows XP — Living Desktop 0.3.0

The project now has two launch targets built from the same desktop renderer:

1. **Web edition (primary target):** a static browser app served by Nginx on SnapDeploy.
2. **Electron edition (optional):** retains the isolated Electron main/preload/WebContentsView implementation for local desktop use.

The original eight source files remain under `legacy/` as a recovery/reference copy. Existing mini-apps are still registered in the shared desktop WindowManager.

## Run the website locally

Requirements: Node.js 22 or newer. The web development server uses only Node built-ins, so a package install is not required for browser mode.

```bash
npm start
```

Open `http://localhost:8080`. The server binds to `0.0.0.0` and uses `PORT` when provided, otherwise `8080`. `/health` returns `200 OK` for container health checks.

Without a compiled WASM bundle, the website uses the equivalent JavaScript fallback for AI decisions and motion. To build the Rust core locally, install Rust and `wasm-pack`, then run:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run build:wasm
```

This writes the generated browser module into `ui/wasm-core/`. Run `cargo test --manifest-path rust-core/Cargo.toml` to execute the Rust unit tests.

## Deploy to SnapDeploy

The repository includes a custom multi-stage `Dockerfile`; SnapDeploy uses it rather than trying to auto-detect the repository as an Electron app.

1. Push the project root (including `Dockerfile`, `nginx.conf.template`, `rust-core/` and `ui/`) to a GitHub repository.
2. In SnapDeploy, connect that GitHub repository and select the branch to deploy. Keep the repository root as the build root.
3. Deploy. The Docker build compiles `rust-core` to `wasm32-unknown-unknown`, copies the generated JS/WASM into the static site, then serves `ui/` using Nginx.
4. The Nginx template listens on SnapDeploy's injected `PORT` (default `8080`) and exposes `/health` for health checking.

No API key or database service is required for this static edition. User data is stored in the browser's IndexedDB/localStorage and stays in that browser profile; it is not synchronized between different devices or browsers.

## Run the optional Electron edition

```bash
npm install
npm run electron
```

`main.js` and `preload.js` remain the Electron entry points. The renderer uses `host-adapter.js` to detect Electron's secure `xpHost` bridge; in Electron the adapter leaves the preload API unchanged.

## Rust/WebAssembly boundary

The following deterministic compute-heavy functions have been moved into `rust-core/`:

- `stable_hash`: FNV-1a over UTF-16 code units, matching the previous JavaScript hash so saved character identities keep stable ability seeds.
- `random_values`: deterministic xorshift32 sequence used for seeded traits and ability selection.
- `choose_action`: personality/utility scoring for autonomous stickman decisions.
- `integrate_motion`: a physics integration step for gravity, friction, cursor-follow, wandering and desktop-edge/floor collision.

The browser DOM, Canvas drawing, Electron IPC adapter, event listeners, WindowManager and IndexedDB remain JavaScript because they are platform APIs and presentation code, not portable compute kernels. Rust runs as WebAssembly in the visitor's browser; this is not a Rust server backend.

## Web-specific behavior and limitations

- Notepad uses the File System Access API when supported and permitted by the browser; otherwise it opens through a file input and saves by downloading a text file.
- My Computer only exposes the virtual filesystem plus directories/files explicitly selected by the visitor. Browser security does not allow silent machine-wide scanning.
- Internet Explorer uses a sandboxed iframe in web mode. Some websites prohibit framing using their own CSP or `X-Frame-Options`; use **Mở ngoài** for those sites. The web edition cannot provide Electron's native Chromium `WebContentsView` behavior inside an ordinary browser tab.
- Browser bookmarks/history, virtual files, settings and stickman memories are local to that browser profile. A shared cloud database and multi-device sync are not included.
- The hosted website cannot resize the visitor's browser window; use the browser's own window controls. Desktop windows inside the simulation remain resizable.
- Stickmen are algorithmic simulations with persistent per-character memories, not conscious entities or external LLM agents.

## Checks

```bash
npm run check
npm test
```

The tests cover JavaScript syntax, deterministic JS/Rust seed parity, calculator parsing, Electron IPC/WebContentsView mocks, web adapter lifecycle/protocol handling, static web server health and SnapDeploy container configuration.

The current build environment used for this handoff does not include `rustc`, `cargo`, `wasm-pack` or Docker. Therefore the Rust source and Docker build have **not** been compiled/executed here. SnapDeploy's first Docker build is the first full Rust/WASM compilation check; inspect its build and container logs before treating the deployment as live.
