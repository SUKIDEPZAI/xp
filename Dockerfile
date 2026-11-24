# SnapDeploy Small containers allow at most two build stages.
# Keep the optional Rust/WASM toolchain out of the constrained image build.
FROM node:22-bookworm-slim AS production-deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

FROM node:22-bookworm-slim AS production
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY server ./server
COPY scripts ./scripts
COPY migrations ./migrations
COPY ui ./ui
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","start"]
