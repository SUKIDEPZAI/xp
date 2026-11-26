'use strict';
const fs = require('node:fs');
const { spawn } = require('node:child_process');
let child = null, lastError = null, startedAt = null;
function enabled() { return process.env.LLAMA_CPP_AUTOSTART === 'true'; }
function integerEnv(name, fallback, min, max) {
  const raw = process.env[name]; if (raw === undefined || raw === '') return fallback;
  const value = Number(raw); if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} must be an integer between ${min} and ${max}`); return value;
}
function buildArgs() {
  const modelPath = String(process.env.LLAMA_CPP_MODEL_PATH || '').trim();
  if (!modelPath) throw new Error('LLAMA_CPP_AUTOSTART=true requires LLAMA_CPP_MODEL_PATH pointing to a local GGUF model file');
  if (!fs.existsSync(modelPath) || !fs.statSync(modelPath).isFile()) throw new Error(`GGUF model file not found: ${modelPath}`);
  const args = ['-m', modelPath, '--host', '127.0.0.1', '--port', String(integerEnv('LLAMA_CPP_PORT', 9931, 1024, 65535)),
    '-c', String(integerEnv('LLAMA_CPP_CTX_SIZE', 4096, 256, 262144)), '-t', String(integerEnv('LLAMA_CPP_THREADS', 4, 1, 256)),
    '-np', String(integerEnv('LLAMA_CPP_PARALLEL', 1, 1, 64)), '--alias', String(process.env.LLAMA_CPP_MODEL || process.env.AI_MODEL || 'local-model')];
  const gpuLayers = process.env.LLAMA_CPP_GPU_LAYERS; if (gpuLayers !== undefined && /^\d+$/.test(gpuLayers)) args.push('--n-gpu-layers', gpuLayers);
  return args;
}
function status() { return { enabled: enabled(), processRunning: Boolean(child && child.exitCode === null && !lastError), startedAt, error: lastError }; }
function start() {
  if (!enabled() || child) return child;
  const bin = process.env.LLAMA_CPP_BIN || 'llama-server', args = buildArgs(), childEnv = { ...process.env };
  for (const name of ['AI_API_KEY','DATABASE_URL','DATABASE_URL_UNPOOLED','SESSION_SECRET','AI_DATABASE_URLS','AI_DATABASE_URL','LLAMA_CPP_API_KEY','LLAMA_ARG_API_KEY']) delete childEnv[name];
  if (process.env.LLAMA_CPP_API_KEY) childEnv.LLAMA_API_KEY = process.env.LLAMA_CPP_API_KEY; else delete childEnv.LLAMA_API_KEY;
  child = spawn(bin, args, { env: childEnv, stdio: ['ignore','inherit','inherit'], windowsHide: true });
  lastError = null; startedAt = new Date().toISOString();
  child.once('error', error => { lastError = error.code || error.message; console.error(`[llama.cpp] Failed to launch ${bin}: ${error.message}`); });
  child.once('close', (code, signal) => { if (code !== 0 && code !== null) lastError = `llama-server exited with code ${code}`; if (signal) lastError = `llama-server exited from ${signal}`; console.log(`[llama.cpp] llama-server stopped (code=${code}, signal=${signal})`); child = null; });
  console.log(`[llama.cpp] Starting local inference: ${bin} ${args.join(' ')}`); return child;
}
function stop() {
  if (!child) return Promise.resolve(); const processToStop = child;
  return new Promise(resolve => { let finished = false, force; const finish = () => { if (finished) return; finished = true; if (force) clearTimeout(force); resolve(); };
    processToStop.once('close', finish); processToStop.kill('SIGTERM'); force = setTimeout(() => { if (processToStop.exitCode === null) processToStop.kill('SIGKILL'); finish(); }, 5000); force.unref(); });
}
module.exports = { enabled, buildArgs, status, start, stop };
