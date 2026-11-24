This directory may contain an optional Rust/WebAssembly build.
SnapDeploy Small Docker builds intentionally do not install Rust or compile WASM,
because the plan allows at most two Docker stages and has a 512 MB build budget.
The application automatically uses its JavaScript fallback when generated bindings
are absent. To build WASM separately on a machine with Rust and wasm-pack:
  rustup target add wasm32-unknown-unknown
  cargo install wasm-pack
  npm run build:wasm
Then include the generated files in ui/wasm-core/ before deployment if desired.
