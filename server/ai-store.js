'use strict';
const { Pool } = require('pg');

let pools = null;
let schemaPromises = new WeakMap();
const hash = value => {
  let h = 2166136261;
  for (const ch of String(value || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
function urlsFromEnv() {
  let values = [];
  if (process.env.AI_DATABASE_URLS) {
    try {
      const parsed = JSON.parse(process.env.AI_DATABASE_URLS);
      if (Array.isArray(parsed)) values = parsed.filter(value => typeof value === 'string' && value.trim());
      else throw new Error('AI_DATABASE_URLS must be a JSON array of connection strings');
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('AI_DATABASE_URLS must be valid JSON, for example ["postgresql://..."]');
      throw error;
    }
  } else if (process.env.AI_DATABASE_URL) values = [process.env.AI_DATABASE_URL];
  else if (process.env.DATABASE_URL) values = [process.env.DATABASE_URL];
  if (!values.length) throw Object.assign(new Error('No database configured for AI memory storage'), { code: 'DATABASE_NOT_CONFIGURED' });
  if (values.length > 8) throw new Error('AI memory supports at most 8 Neon database shards per instance');
  return [...new Set(values.map(value => value.trim()))];
}
function getPools() {
  if (pools) return pools;
  const urls = urlsFromEnv();
  pools = urls.map((connectionString, index) => {
    const pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 30000, connectionTimeoutMillis: 8000, keepAlive: true, application_name: `xp-stickman-ai-${index + 1}` });
    pool.on('error', error => console.error('AI database pool error:', error.message));
    return pool;
  });
  return pools;
}
function poolFor(characterId) {
  const values = getPools();
  return values[hash(characterId) % values.length];
}
async function ensureSchema(pool) {
  if (schemaPromises.has(pool)) return schemaPromises.get(pool);
  const promise = pool.query(`
    CREATE TABLE IF NOT EXISTS stickman_minds (
      user_id text NOT NULL,
      character_id text NOT NULL,
      mind_state jsonb NOT NULL DEFAULT '{}'::jsonb,
      version integer NOT NULL DEFAULT 1,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, character_id)
    );
    CREATE TABLE IF NOT EXISTS stickman_ai_experiences (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      character_id text NOT NULL,
      experience_type varchar(40) NOT NULL DEFAULT 'event',
      content varchar(500) NOT NULL DEFAULT '',
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS stickman_ai_experiences_character_idx
      ON stickman_ai_experiences(user_id, character_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS stickman_ai_decisions (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      character_id text NOT NULL,
      action varchar(40) NOT NULL,
      decision jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS stickman_ai_decisions_character_idx
      ON stickman_ai_decisions(user_id, character_id, created_at DESC);
  `);
  schemaPromises.set(pool, promise);
  try { await promise; } catch (error) { schemaPromises.delete(pool); throw error; }
}
async function loadMind(userId, characterId) {
  const pool = poolFor(characterId); await ensureSchema(pool);
  const { rows } = await pool.query('SELECT mind_state FROM stickman_minds WHERE user_id=$1 AND character_id=$2 LIMIT 1', [userId, characterId]);
  return rows[0]?.mind_state || null;
}
async function saveMind(userId, characterId, mind) {
  const pool = poolFor(characterId); await ensureSchema(pool);
  await pool.query(`INSERT INTO stickman_minds(user_id, character_id, mind_state, version, updated_at)
    VALUES($1,$2,$3::jsonb,1,now())
    ON CONFLICT(user_id, character_id) DO UPDATE SET mind_state=EXCLUDED.mind_state,
      version=stickman_minds.version+1, updated_at=now()`, [userId, characterId, JSON.stringify(mind || {})]);
}
async function recordExperience(userId, characterId, experience) {
  if (!experience?.id) return;
  const pool = poolFor(characterId); await ensureSchema(pool);
  await pool.query(`INSERT INTO stickman_ai_experiences(id,user_id,character_id,experience_type,content,metadata,created_at)
    VALUES($1,$2,$3,$4,$5,$6::jsonb,to_timestamp($7/1000.0)) ON CONFLICT(id) DO NOTHING`, [
    String(experience.id).slice(0, 100), userId, characterId, String(experience.kind || 'event').slice(0, 40),
    String(experience.text || experience.content || '').slice(0, 500), JSON.stringify({ ...(experience.metadata || {}), importance: Number(experience.importance ?? .35) }), Number(experience.at || Date.now())
  ]);
}
async function loadExperiences(userId, characterId, limit = 12) {
  const pool = poolFor(characterId); await ensureSchema(pool);
  const count = Math.max(1, Math.min(40, Math.floor(Number(limit) || 12)));
  const { rows } = await pool.query(`SELECT id, experience_type, content, metadata, created_at
    FROM stickman_ai_experiences WHERE user_id=$1 AND character_id=$2
    ORDER BY created_at DESC LIMIT $3`, [userId, characterId, count]);
  return rows.reverse().map(row => ({
    id: String(row.id), kind: String(row.experience_type || 'event'), text: String(row.content || ''),
    metadata: row.metadata || {}, at: new Date(row.created_at).getTime(), importance: Number(row.metadata?.importance ?? .35)
  }));
}
async function recordDecision(userId, characterId, decision) {
  const pool = poolFor(characterId); await ensureSchema(pool);
  await pool.query('INSERT INTO stickman_ai_decisions(id,user_id,character_id,action,decision) VALUES($1,$2,$3,$4,$5::jsonb)', [
    require('node:crypto').randomUUID(), userId, characterId, String(decision.action || 'idle').slice(0, 40), JSON.stringify(decision)
  ]);
}
async function close() {
  const current = pools; pools = null; schemaPromises = new WeakMap();
  if (current) await Promise.all(current.map(pool => pool.end()));
}
module.exports = { loadMind, saveMind, loadExperiences, recordExperience, recordDecision, close, urlsFromEnv };
