# Upgrade report — Windows XP Living Desktop v0.4.5

## Scope
Integrated `ggml-org/llama.cpp` as local/self-hosted inference for the existing per-Stickman AI gateway. This builds on v0.4.4 and preserves Paint character creation, mind persistence, animation validation, Neon account/cloud sync and the Node SnapDeploy app.

## Changes
- `AI_BACKEND=llama.cpp` does not require `AI_API_KEY` or paid tokens.
- Node orchestrator calls llama.cpp `POST /v1/chat/completions`, supports optional private server authentication, bounded output and local inference timeout.
- Optional native runtime starts/stops `llama-server` when binary and GGUF model already exist. Secret values are passed via child environment (upstream `LLAMA_API_KEY`), not process arguments; database/session/provider secrets are removed from the inference child environment.
- `docker-compose.llama.yml` uses the official server image, mounts GGUF read-only, and keeps the inference port internal.
- `/api/v1/ai/status` reports provider, token requirement, native process status and `/health` readiness.
- Fixed persistence gate so `model-local` results record learning, memory and decisions in the same Neon mind-store path as `model` results.
- `AI_DATABASE_URLS` remains 1–8 deterministic Neon shards.

## Resource/deployment note
SnapDeploy Small (512 MB) is suitable for the Node/Neon app, not for loading most GGUF weights and context. Keep SnapDeploy as the application server and connect to a private inference host, or run the Compose stack on a properly provisioned machine. Multiple PostgreSQL databases add storage/sharding, not model RAM/CPU/GPU. No model weights, API keys or Neon credentials are bundled.

## Verification
- `npm run check`: PASS.
- `npm test`: PASS, including `scripts/llama-cpp-smoke.js`.
- Compose YAML parse: PASS. Docker CLI is not installed here, so Compose config/build was unavailable.
- llama.cpp and a real GGUF model were not run; inference tests use a mocked endpoint. Live SnapDeploy and Neon deployment remain unverified.

Upstream: https://github.com/ggml-org/llama.cpp ; https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md ; https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md
