'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

(async () => {
  const port = 18173 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [path.join(__dirname, 'serve-web.js')], {
    env: { ...process.env, PORT: String(port), DATABASE_URL: '', DATABASE_URL_UNPOOLED: '', SESSION_SECRET: '' },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let healthy = false;
    for (let attempt = 0; attempt < 35; attempt++) {
      try {
        const response = await fetch(`${base}/health`);
        if (response.ok && (await response.text()) === 'ok') { healthy = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(healthy, true, `web server did not become healthy: ${stderr}`);

    const index = await fetch(base);
    assert.equal(index.status, 200);
    const html = await index.text();
    assert.match(html, /Windows XP/);
    assert.match(html, /host-adapter\.js/);

    const adapter = await fetch(`${base}/host-adapter.js`);
    assert.equal(adapter.status, 200);
    assert.match(await adapter.text(), /showOpenFilePicker/);

    const ready = await fetch(`${base}/ready`);
    assert.equal(ready.status, 503, 'readiness must stay red without a configured database');
    assert.equal(await ready.text(), 'database_not_configured');

    const apiHealth = await fetch(`${base}/api/v1/health`);
    assert.equal(apiHealth.status, 200);
    assert.equal((await apiHealth.json()).database, 'not_configured');

    const authUnavailable = await fetch(`${base}/api/v1/auth/me`);
    assert.equal(authUnavailable.status, 503, 'account API must not claim to work without Neon');

    const denied = await fetch(`${base}/not-a-real-file`);
    assert.equal(denied.status, 404);
    console.log('PASS: web server liveness, DB readiness fail-closed, API health, no-database auth response, desktop entry and 404 handling');
  } finally {
    child.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
