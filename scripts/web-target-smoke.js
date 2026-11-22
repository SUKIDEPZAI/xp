'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

(async () => {
  const port = 18173 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [path.join(__dirname, 'serve-web.js')], {
    env: { ...process.env, PORT: String(port) },
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

    const denied = await fetch(`${base}/not-a-real-file`);
    assert.equal(denied.status, 404);
    console.log('PASS: standalone web server health, desktop entry, adapter asset and 404 handling');
  } finally {
    child.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
