const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of [
  'main.js','preload.js','scripts/serve-web.js','ui/host-adapter.js','ui/desktop.js',
  'ui/modules/event-bus.js','ui/modules/storage-manager.js',
  'ui/modules/ai-engine.js','ui/modules/window-manager.js',
  'ui/modules/context-menu.js','ui/modules/stickman-runtime.js'
]) {
  const source = read(file);
  new vm.Script(source, { filename: file });
}

const aiContext = { window: {} };
vm.runInNewContext(read('ui/modules/ai-engine.js'), aiContext);
const profileA = aiContext.window.XPAI.profile('Shadow', 'stable-id', 'Curious');
const profileB = aiContext.window.XPAI.profile('Shadow', 'stable-id', 'Curious');
assert.deepEqual(
  JSON.parse(JSON.stringify(profileA.abilities)),
  JSON.parse(JSON.stringify(profileB.abilities)),
  'name + id should produce stable abilities'
);
assert.equal(profileA.abilities.length, 2);
assert.equal(aiContext.window.XPAI.hash('Bóng Đêm|character-1'), 271998269, 'JavaScript seed must match Rust UTF-16 FNV-1a parity');
assert.ok(profileA.traits.curiosity >= 0 && profileA.traits.curiosity <= 1);
assert.deepEqual(JSON.parse(JSON.stringify(profileA.abilities.map(item=>item.id))), ['shadow-step','energy-bounce']);

const desktop = read('ui/desktop.js');
const runtime = read('ui/modules/stickman-runtime.js');
const rustCore = read('rust-core/src/lib.rs');
const hostAdapter = read('ui/host-adapter.js');
const dockerfile = read('Dockerfile');
const nginx = read('nginx.conf.template');
const pkg = JSON.parse(read('package.json'));
const windowManager = read('ui/modules/window-manager.js');
const menus = read('ui/modules/context-menu.js');
const main = read('main.js');
const parserStart = desktop.indexOf('function parseArithmetic');
const parserEnd = desktop.indexOf('function calc', parserStart);
assert.ok(parserStart >= 0 && parserEnd > parserStart);
const parserContext = {};
vm.runInNewContext(desktop.slice(parserStart, parserEnd), parserContext);
assert.equal(parserContext.parseArithmetic('2+2*3'), 8);
assert.equal(parserContext.parseArithmetic('(10-4)/2'), 3);
assert.equal(parserContext.parseArithmetic('-3+5'), 2);
assert.throws(() => parserContext.parseArithmetic('2/0'));
assert.throws(() => parserContext.parseArithmetic('alert(1)'));

const html = read('ui/index.html');
for (const [, script] of html.matchAll(/src="([^"]+\.js)"/g)) {
  assert.ok(fs.existsSync(path.join(root, 'ui', script)), `missing renderer script: ${script}`);
}
assert.match(main, /new WebContentsView/);
assert.match(main, /BROWSER_NEW_TAB_URL/);
assert.match(main, /contextIsolation: true/);
assert.match(main, /nodeIntegration: false/);
assert.match(main, /sandbox: true/);
assert.match(read('preload.js'), /xpHost/);
assert.doesNotMatch(desktop, /Function\s*\(/);
assert.doesNotMatch(desktop, /\beval\s*\(/);
assert.doesNotMatch(desktop, /<iframe/i);
assert.match(desktop, /window\.open\(current\.url,'_blank','noopener,noreferrer'\)/, 'web IE external navigation must require a click and use noopener');
assert.match(desktop, /before\.split\('\\n'\)/, 'Notepad should count actual newline characters');
assert.match(desktop, /setAutoArrange/);
assert.match(desktop, /paint-draw/);
assert.match(runtime, /document\.addEventListener\('pointermove'/, 'stickman cursor perception must receive pointer movement');
assert.match(runtime, /XPAI\.integrateMotion/, 'stickman motion should use the portable simulation core');
assert.match(rustCore, /pub fn stable_hash/);
assert.match(rustCore, /pub fn choose_action/);
assert.match(rustCore, /pub fn integrate_motion/);
assert.match(hostAdapter, /showOpenFilePicker/);
assert.match(hostAdapter, /sandbox/);
assert.match(hostAdapter, /validWebUrl/);
assert.match(dockerfile, /wasm-pack build/);
assert.match(dockerfile, /EXPOSE 8080/);
assert.ok(nginx.includes('listen ${PORT};'));
assert.equal(pkg.scripts.start, 'node scripts/serve-web.js');
assert.equal(pkg.scripts.electron, 'electron .');
assert.match(runtime, /Math\.min\(all\.length,180\)/, 'memory count should match retained record count');
assert.match(windowManager, /keyboardControl/);
assert.match(windowManager, /task-icon/);
assert.match(menus, /window\.launchApp\?\.\('control'\)/, 'Properties should open Control Panel');

const appIds = ['pc','bin','note','paint','calc','mine','sol','ie','wmp','stickman'];
for (const id of appIds) assert.match(desktop, new RegExp(`\\['${id}'`), `existing/added app ${id} not registered`);
for (const file of ['legacy/main.js','legacy/app.js','legacy/style.css','legacy/page.html','legacy/mnt_user-data_outputs_index.html']) {
  assert.ok(fs.existsSync(path.join(root,file)), `legacy source not preserved: ${file}`);
}

console.log('PASS: JavaScript syntax for main, preload, renderer and modules');
console.log('PASS: deterministic character ability seed');
console.log('PASS: calculator safe parser');
console.log('PASS: local renderer module paths');
console.log('PASS: Electron isolation and WebContentsView references');
console.log('PASS: legacy app sources preserved');
console.log('PASS: desktop pointer perception, Paint events, shortcuts and window keyboard controls');
console.log('PASS: browser host adapter, Rust/WASM core declarations and SnapDeploy Docker/Nginx setup');
