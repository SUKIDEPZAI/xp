'use strict';
const assert = require('node:assert/strict');
const brain = require('../server/ai-orchestrator');
const keys = ['AI_API_KEY','AI_MODEL','AI_API_URL','AI_API_BASE_URL','AI_PROVIDER','AI_BACKEND','LLAMA_CPP_BASE_URL','LLAMA_CPP_API_KEY','LLAMA_CPP_MODEL','LLAMA_CPP_ALLOW_INSECURE_HTTP','LLAMA_CPP_AUTOSTART'];
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const originalFetch = global.fetch;
(async () => {
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(brain.configured(), false);
    assert.equal(brain.providerInfo().configured, false);
    process.env.AI_API_KEY = 'REPLACE_WITH_PRIVATE_PROVIDER_KEY';
    process.env.AI_MODEL = 'REPLACE_WITH_MODEL_ID';
    process.env.AI_API_BASE_URL = 'https://YOUR-AI-PROVIDER.example/v1';
    assert.equal(brain.configured(), false, 'example .env placeholders must never activate the model adapter');

    const safe = brain.validateDecision({
      action: 'run', goal: 'Explore safely', emotion: 'curious', thought: 'I noticed an icon.',
      learning: { curiosity: .5, creativity: -.01, extra: 4 },
      animation: { clip: 'walk cycle', durationMs: 40000, frames: Array.from({length: 30}, (_, i) => ({
        at: i * 200, pose: 'walk', x: 9999, y: -9999, joints: { armL: [999, -999], legR: [10, -10], body: 88 }
      })) },
      executable: 'process.exit(1)'
    });
    assert.equal(safe.action, 'run');
    assert.equal(safe.learning.curiosity, .025);
    assert.equal(safe.learning.extra, undefined);
    assert.equal(safe.animation.frames.length, 20);
    assert.equal(safe.animation.durationMs, 10000);
    assert.equal(safe.animation.frames[0].x, 120);
    assert.equal(safe.animation.frames[0].y, -80);
    assert.deepEqual(safe.animation.frames[0].joints.armL, [175, -175]);
    assert.equal(safe.animation.frames[0].joints.body, 35);
    assert.equal(safe.executable, undefined);
    const safeWithoutAnimation = brain.validateDecision({ action: 'wave' });
    assert.ok(safeWithoutAnimation.animation, 'missing AI animation must receive a safe fallback plan');
    assert.equal(safeWithoutAnimation.animation.frames.length, 0);
    const parsed = brain.parseContent('```json\n{"action":"wave"}\n```');
    assert.equal(parsed.action, 'wave');
    assert.throws(() => brain.parseContent('not json'));

    // Exercise the real adapter against a deterministic fake OpenAI-compatible gateway.
    process.env.AI_API_KEY = 'test-secret-never-in-browser';
    process.env.AI_MODEL = 'test-stickman-model';
    process.env.AI_API_BASE_URL = 'https://ai.example.test/v1';
    process.env.AI_PROVIDER = 'test-gateway';
    let requestSeen = null;
    global.fetch = async (url, options) => {
      requestSeen = { url: String(url), authorization: options.headers.Authorization, body: JSON.parse(options.body) };
      return {
        ok: true, status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify({
          action: 'wave', goal: 'Chào người dùng', thought: 'Mình nhớ lần trước bạn ghé Paint.', reply: 'Chào bạn!', emotion: 'friendly',
          memory: 'Người dùng thường ghé Paint.', learning: { sociability: .01 },
          animation: { clip: 'friendly-wave', durationMs: 1600, frames: [
            { at: 0, pose: 'idle', x: 0, y: 0 }, { at: 350, pose: 'think', x: 0, y: -1 },
            { at: 800, pose: 'wave', x: 0, y: 0, joints: { armR: [132, -82] } }, { at: 1400, pose: 'idle', x: 0, y: 0 }
          ] }
        }) } }] })
      };
    };
    assert.equal(brain.configured(), true);
    const result = await brain.think({
      character: { id: 'char-shadow', name: 'Shadow', personality: 'Creative', profile: { traits: { creativity: .8 } }, needs: { energy: .7 } },
      context: { event: 'user opened Paint', userMessage: 'Xin chào' },
      memories: [{ kind: 'interaction', text: 'Người dùng thường ghé Paint.', importance: .8 }],
      mind: { disposition: 'Ham khám phá', experienceCount: 12 }
    });
    assert.equal(result.mode, 'model');
    assert.equal(result.decision.action, 'wave');
    assert.equal(result.decision.animation.frames.length, 4);
    assert.equal(requestSeen.url, 'https://ai.example.test/v1/chat/completions');
    assert.equal(requestSeen.authorization, 'Bearer test-secret-never-in-browser');
    assert.match(requestSeen.body.messages[0].content, /independent mind of one virtual Stickman/);
    assert.match(requestSeen.body.messages[1].content, /char-shadow/);
    assert.match(requestSeen.body.messages[1].content, /Người dùng thường ghé Paint/);
    console.log('PASS: central AI provider configuration, placeholder protection, mocked real model request, per-character context and safe motion-plan validation');
  } finally {
    global.fetch = originalFetch;
    for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
