This directory is populated during the SnapDeploy Docker build by wasm-pack.
The website intentionally falls back to the equivalent JavaScript algorithms when
WebAssembly has not been built (for example when opened directly from a dev server).
Build command: cd rust-core && wasm-pack build --target web --release --out-dir ../ui/wasm-core --out-name xp_core
