'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const load = (file, context = {}) => {
  const sandbox = { window: {}, ...context };
  vm.runInNewContext(read(file), sandbox, { filename: file });
  return sandbox;
};


// .env loading is available without dotenv and never overrides injected secrets.
const envFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'xp-env-test-')), '.env');
fs.writeFileSync(envFile, 'XP_TEST_VALUE=loaded\nXP_TEST_QUOTED=\"hello world\"\nXP_TEST_INJECTED=file-value\n');
const oldEnv = { value: process.env.XP_TEST_VALUE, quoted: process.env.XP_TEST_QUOTED, injected: process.env.XP_TEST_INJECTED };
process.env.XP_TEST_INJECTED = 'platform-value';
require('../scripts/load-env')(envFile);
assert.equal(process.env.XP_TEST_VALUE, 'loaded');
assert.equal(process.env.XP_TEST_QUOTED, 'hello world');
assert.equal(process.env.XP_TEST_INJECTED, 'platform-value');
for (const [key, value] of [['XP_TEST_VALUE', oldEnv.value], ['XP_TEST_QUOTED', oldEnv.quoted], ['XP_TEST_INJECTED', oldEnv.injected]]) {
  if (value === undefined) delete process.env[key]; else process.env[key] = value;
}
fs.rmSync(path.dirname(envFile), { recursive: true, force: true });

// Canonical action vocabulary and backward-compatibility aliases.
const actionCtx = load('ui/modules/action-registry.js');
const actions = actionCtx.window.XPActions;
assert.equal(new Set(actions.ACTIONS).size, actions.ACTIONS.length);
assert.ok(actions.ACTIONS.includes('tab-prank'));
assert.equal(actions.normalize('wander'), 'explore');
assert.equal(actions.normalize('look'), 'observe');
assert.equal(actions.normalize('socialize'), 'socialize');
assert.equal(actions.isValid('walk'), true);
assert.equal(actions.isValid('not-a-real-action'), false);

// Personality, needs, contextual planner and memory ranking.
const aiCtx = load('ui/modules/ai-engine.js', { window: { XPActions: actions } });
const ai = aiCtx.window.XPAI;
const profileA = ai.profile('Moss', 'char-moss', 'Curious');
const profileB = ai.profile('Renamed', 'char-moss', 'Curious');
assert.deepEqual(JSON.parse(JSON.stringify(profileA.abilities)), JSON.parse(JSON.stringify(profileB.abilities)));
assert.equal(Object.keys(profileA.traits).length, 10);
assert.ok(profileA.abilities.length === 2);
const action = ai.decide({
  id: 'char-moss', name: 'Moss', personality: 'Creative', profile: ai.profile('Moss', 'char-moss', 'Creative'),
  needs: { energy: .8, creativity: .98, curiosity: .5, social: .2, entertainment: .3, comfort: .8, exploration: .2 },
  action: 'rest', repetition: 0, goals: [{ type: 'create', status: 'active' }]
}, { now: 100000, paintOpen: true, artworkNeeded: true });
assert.ok(actions.isValid(action), `planner emitted unsupported action: ${action}`);
assert.ok(ai.decayNeeds({ energy: .8 }, 60000, 'run').energy < .8);
const memories = Array.from({ length: 12 }, (_, i) => ({ id: String(i), text: `Paint memory ${i}`, importance: i / 12, confidence: .8, at: Date.now() }));
assert.equal(ai.retrieveMemories(memories, { query: 'paint' }).length, 8);

// Drawing DSL validates commands and escapes untrusted text in SVG.
const drawingCtx = load('ui/modules/drawing-engine.js');
const drawing = drawingCtx.window.XPDrawing;
const artwork = drawing.generateArtwork({ id: 'char-moss', name: 'Moss', color: '#1288cc', profile: { seed: 4 } });
assert.ok(artwork.commands.length >= 10);
assert.throws(() => drawing.validateCommand({ op: 'script', code: 'alert(1)' }));
const svg = drawing.toSVG({ name: 'Safe', width: 100, height: 100, commands: [{ op: 'text', x: 1, y: 20, value: '<script>&', fill: '#112233' }] });
assert.match(svg, /&lt;script&gt;&amp;/);
assert.doesNotMatch(svg, /<script>/);
assert.throws(() => drawing.validateDocument({ commands: Array(2001).fill({ op: 'line' }) }));

// Stickman-only appearance stays in a constrained profile model, not in Paint image pixels.
const appearanceCtx = load('ui/modules/stickman-appearance.js');
const appearanceApi = appearanceCtx.window.XPStickmanAppearance;
const appearanceA = appearanceApi.create('char-moss', '#202020', 'Creative');
const appearanceB = appearanceApi.create('char-moss', '#202020', 'Creative');
assert.deepEqual(JSON.parse(JSON.stringify(appearanceA)), JSON.parse(JSON.stringify(appearanceB)));
assert.ok(appearanceApi.HAIR.includes(appearanceA.hairStyle));
assert.ok(appearanceApi.OUTFITS.includes(appearanceApi.refine(appearanceA, { seed: 'char-moss', personality: 'Creative' }).outfitStyle));
assert.equal(appearanceApi.normalize({ hairStyle: 'execute-script', accessory: '<img>' }).hairStyle, 'short');
assert.equal(appearanceApi.normalize({ hairStyle: 'execute-script', accessory: '<img>' }).accessory, 'none');

// Animation projects have bounded frames, supported poses and smooth interpolation.
const animationCtx = load('ui/modules/animation-engine.js', { window: { XPActions: actions, XPStickmanAppearance: appearanceApi } });
const animation = animationCtx.window.XPAnimation;
const samples = animation.sampleProjects();
assert.equal(samples.length, 15);
assert.ok(samples.every(project => project.frames.length >= 2 && project.frames.length <= 500));
const project = animation.create('Walk', 'char-moss');
const pose = animation.interpolate(project, 6);
assert.ok(Number.isFinite(pose.x) && Number.isFinite(pose.y));
assert.equal(animation.validateProject({ frames: [{ at: 0, pose: 'unsupported-action' }] }).frames[0].pose, 'idle');
assert.throws(() => animation.validateProject({ frames: [] }));
const generated = animation.generateForCharacter({ id: 'char-moss', name: 'Moss', color: '#1288cc', personality: 'Creative', profile: { appearance: appearanceA } });
assert.ok(generated.frames.length >= 5, 'character-specific animation should contain multiple generated keyframes');
assert.equal(generated.metadata.generator, 'personality-motion-v1');
assert.equal(generated.characterId, 'char-moss');
assert.equal(generated.metadata.appearance.hairStyle, appearanceA.hairStyle);
assert.ok(generated.frames.every(frame => actions.isValid(frame.pose)));
assert.deepEqual(JSON.parse(JSON.stringify(ai.normalizeNeeds({}))), { energy: .82, curiosity: .48, social: .55, entertainment: .58, creativity: .5, comfort: .78, exploration: .42 });

// Security and architecture invariants: constrained interaction, private account data,
// no renderer-side database credentials, and owner-scoped relational sync.
const interaction = read('ui/modules/interaction-api.js');
assert.match(interaction, /ALLOWED_APPS/);
assert.doesNotMatch(interaction, /window\.close\s*\(/);
assert.doesNotMatch(interaction, /\beval\s*\(/);
const runtime = read('ui/modules/stickman-runtime.js');
assert.match(runtime, /XPAI\.retrieveMemories/);
assert.match(runtime, /async function createAnimation/);
assert.match(runtime, /XPAnimation\.generateAndSave/);
assert.match(runtime, /function updateGoal/);
assert.match(runtime, /function updateAppearance/);
assert.match(runtime, /agent\.profile\?\.appearance/);
assert.match(runtime, /stickman:loaded/);
const sync = read('ui/modules/cloud-sync.js');
assert.match(sync, /enqueueSync/);
assert.match(sync, /cloudOwnerId/);
assert.match(sync, /ownerId:account\.id/);
assert.match(sync, /accountQueue=queue\.filter/);
assert.match(sync, /addEventListener\('online'/);
const api = read('server/api.js');
assert.match(api, /ownedIds/);
assert.match(api, /argon2\.hash/);
assert.match(api, /createHmac\('sha256',secret\)/);
assert.match(api, /SESSION_SECRET/);
assert.match(api, /HttpOnly/);
assert.match(api, /SameSite=Strict/);
assert.match(api, /currentSettings\.updatedAt/);
assert.match(api, /last-write-wins-by-updatedAt/);
assert.match(sync, /updatedAt:timestamp\(remote\.settings\.updatedAt\)/);
const html = read('ui/index.html');
assert.doesNotMatch(html, /DATABASE_URL|SESSION_SECRET/);
assert.match(html, /modules\/stickman-appearance\.js/);
assert.doesNotMatch(html, /animation-studio\.js/);
assert.doesNotMatch(read('ui/desktop.js'), /Stickman Animation Studio|My Drawings & Animations|launchApp\?\.\('animation'/);
assert.match(read('ui/desktop.js'), /Tạo Stickman/);
assert.match(read('ui/desktop.js'), /Chỉnh ngoại hình trong Paint/);
assert.doesNotMatch(read('ui/modules/interaction-api.js'), /'animation'|'artwork'/);
assert.match(html, /wasm-unsafe-eval/);
assert.match(read('Dockerfile'), /node:22/);
assert.match(read('migrations/0001_initial.sql'), /CREATE TABLE IF NOT EXISTS character_relationships/);
assert.match(read('migrations/0001_initial.sql'), /CREATE TABLE IF NOT EXISTS animation_projects/);

console.log('PASS: Node .env loading and injected environment precedence');
console.log('PASS: canonical action enum and legacy aliases');
console.log('PASS: personality, utility planning, needs and bounded memory retrieval');
console.log('PASS: validated vector drawing DSL and SVG escaping');
console.log('PASS: character appearance profiles, constrained styling, personality-generated animation and interpolation');
console.log('PASS: constrained interaction, owner-scoped cloud sync, auth and database schema guards');
