import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db: DatabaseType = new Database(path.join(DATA_DIR, 'systemtwin.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS architectures (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Untitled Architecture',
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    thumbnail TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_architectures_user_id ON architectures(user_id);

  CREATE TABLE IF NOT EXISTS architecture_versions (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    change_summary TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_arch_versions_arch_id ON architecture_versions(architecture_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_arch_versions_unique ON architecture_versions(architecture_id, version_number);

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    owner_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'member')),
    invited_by TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id),
    UNIQUE(team_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS architecture_permissions (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    team_id TEXT,
    user_id TEXT,
    permission TEXT NOT NULL DEFAULT 'viewer' CHECK(permission IN ('owner', 'editor', 'viewer')),
    granted_by TEXT NOT NULL,
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    CHECK((team_id IS NOT NULL AND user_id IS NULL) OR (team_id IS NULL AND user_id IS NOT NULL))
  );

  CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
  CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_arch_perms_arch ON architecture_permissions(architecture_id);
  CREATE INDEX IF NOT EXISTS idx_arch_perms_team ON architecture_permissions(team_id);
  CREATE INDEX IF NOT EXISTS idx_arch_perms_user ON architecture_permissions(user_id);

  CREATE TABLE IF NOT EXISTS simulation_recordings (
    id TEXT PRIMARY KEY,
    architecture_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Recording',
    config TEXT NOT NULL,
    tick_count INTEGER NOT NULL DEFAULT 0,
    ticks TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_recordings_user ON simulation_recordings(user_id);
  CREATE INDEX IF NOT EXISTS idx_recordings_arch ON simulation_recordings(architecture_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    node_id TEXT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_comments_arch ON comments(architecture_id);
  CREATE INDEX IF NOT EXISTS idx_comments_node ON comments(node_id);

  CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    architecture_id TEXT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_activity_arch ON activity_log(architecture_id);
  CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT,
    expires_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL DEFAULT '[]',
    secret TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);

  CREATE TABLE IF NOT EXISTS marketplace_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    author_id TEXT NOT NULL,
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    downloads INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_marketplace_author ON marketplace_templates(author_id);

  CREATE TABLE IF NOT EXISTS template_ratings (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    review TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (template_id) REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(template_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS embeds (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    allow_interaction INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (architecture_id) REFERENCES architectures(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
