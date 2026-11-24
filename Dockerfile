# Stage 1: compile the optional deterministic compute kernel to WebAssembly.
FROM rust:bookworm AS rust-wasm-build
RUN rustup target add wasm32-unknown-unknown && cargo install wasm-pack --locked
WORKDIR /workspace
COPY rust-core/Cargo.toml ./rust-core/Cargo.toml
COPY rust-core/src ./rust-core/src
RUN cd rust-core && wasm-pack build --target web --release --out-dir /workspace/wasm-core --out-name xp_core

# Stage 2: install only production dependencies for the Node API/runtime.
FROM node:22-bookworm-slim AS production-deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Stage 3: one same-origin Node process serves both the desktop and API.
FROM node:22-bookworm-slim AS production
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
WORKDIR /app
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY server ./server
COPY scripts ./scripts
COPY migrations ./migrations
COPY ui ./ui
COPY --from=rust-wasm-build /workspace/wasm-core/ ./ui/wasm-core/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","scripts/serve-web.js"]
