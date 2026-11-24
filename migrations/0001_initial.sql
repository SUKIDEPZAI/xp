CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username varchar(32) NOT NULL UNIQUE,
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS desktop_settings (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'blue',
  wallpaper text NOT NULL DEFAULT 'bliss',
  desktop_layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS characters (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(32) NOT NULL,
  color varchar(7) NOT NULL DEFAULT '#202020',
  personality jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  needs jsonb NOT NULL DEFAULT '{}'::jsonb,
  energy real NOT NULL DEFAULT .8,
  emotion text NOT NULL DEFAULT 'calm',
  current_state text NOT NULL DEFAULT 'Idle',
  current_goal text NOT NULL DEFAULT '',
  position jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS characters_user_idx ON characters(user_id);
CREATE INDEX IF NOT EXISTS characters_user_updated_idx ON characters(user_id,updated_at);
CREATE TABLE IF NOT EXISTS character_memories (
  id text PRIMARY KEY,
  character_id text NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type text NOT NULL DEFAULT 'event',
  content text NOT NULL,
  importance real NOT NULL DEFAULT .3,
  confidence real NOT NULL DEFAULT .8,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memories_character_created_idx ON character_memories(character_id,created_at);
CREATE INDEX IF NOT EXISTS memories_user_idx ON character_memories(user_id);
CREATE TABLE IF NOT EXISTS character_relationships (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_a text NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_b text NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'acquaintance',
  affinity real NOT NULL DEFAULT 0,
  interaction_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,character_a,character_b)
);
CREATE INDEX IF NOT EXISTS relationships_user_idx ON character_relationships(user_id);
CREATE TABLE IF NOT EXISTS character_goals (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id text NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  priority real NOT NULL DEFAULT .5,
  progress real NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS goals_character_idx ON character_goals(character_id,status);
CREATE TABLE IF NOT EXISTS animation_projects (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id text REFERENCES characters(id) ON DELETE SET NULL,
  name varchar(120) NOT NULL,
  fps integer NOT NULL DEFAULT 24,
  loop boolean NOT NULL DEFAULT false,
  timeline jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS animations_user_idx ON animation_projects(user_id,updated_at);
CREATE TABLE IF NOT EXISTS drawing_assets (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id text REFERENCES characters(id) ON DELETE SET NULL,
  name varchar(120) NOT NULL,
  format text NOT NULL DEFAULT 'vector-json',
  vector_data jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS drawings_user_idx ON drawing_assets(user_id,updated_at);
