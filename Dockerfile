# Compile the simulation/decision core to WebAssembly. SnapDeploy builds this
# multi-stage image for its container architecture, so no Rust runtime is needed.
FROM rust:bookworm AS rust-wasm-build
RUN rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack --locked
WORKDIR /workspace
COPY rust-core/Cargo.toml ./rust-core/Cargo.toml
COPY rust-core/src ./rust-core/src
RUN cd rust-core \
    && wasm-pack build --target web --release --out-dir /workspace/wasm-core --out-name xp_core

# The production app is a static web desktop served by Nginx.
FROM nginx:alpine AS web
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY ui/ /usr/share/nginx/html/
COPY --from=rust-wasm-build /workspace/wasm-core/ /usr/share/nginx/html/wasm-core/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD-SHELL wget -q -O /dev/null "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["nginx", "-g", "daemon off;"]
