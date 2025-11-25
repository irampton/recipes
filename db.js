import Database from "better-sqlite3";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || "./lembas.db";
const resolvedDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, dbPath);

const db = new Database(resolvedDbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'user')),
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS join_codes (
    code TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'user')),
    createdAt TEXT NOT NULL,
    createdBy TEXT,
    usedBy TEXT,
    usedAt TEXT,
    expiresAt TEXT,
    maxUses INTEGER DEFAULT 1,
    usedCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    author TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    ingredients TEXT DEFAULT '[]',
    steps TEXT DEFAULT '[]',
    ownerId TEXT NOT NULL,
    isPublic INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    servingsQuantity TEXT DEFAULT '',
    servingsUnit TEXT DEFAULT '',
    FOREIGN KEY (ownerId) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_recipes_owner ON recipes(ownerId);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
  CREATE INDEX IF NOT EXISTS idx_join_codes_used ON join_codes(usedBy);

  CREATE TABLE IF NOT EXISTS recipe_shares (
    id TEXT PRIMARY KEY,
    recipeId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public', 'user')),
    userId TEXT,
    canEdit INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_shares_recipe ON recipe_shares(recipeId);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_public_share_unique ON recipe_shares(recipeId) WHERE type = 'public';
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_share_unique ON recipe_shares(recipeId, userId) WHERE type = 'user';
`);

const joinCodeColumns = db.prepare("PRAGMA table_info('join_codes')").all();
const hasMaxUses = joinCodeColumns.some((col) => col.name === "maxUses");
const hasUsedCount = joinCodeColumns.some((col) => col.name === "usedCount");
if (!hasMaxUses) {
  db.exec("ALTER TABLE join_codes ADD COLUMN maxUses INTEGER DEFAULT 1;");
}
if (!hasUsedCount) {
  db.exec("ALTER TABLE join_codes ADD COLUMN usedCount INTEGER DEFAULT 0;");
}

// Normalize any legacy codes with dashes into dash-less uppercase form
try {
  db.exec("UPDATE join_codes SET code = REPLACE(UPPER(code), '-', '') WHERE code LIKE '%-%';");
} catch {
  // ignore migration issues; future creates use normalized codes
}

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const recipeColumns = db.prepare("PRAGMA table_info('recipes')").all();
const hasServingsQuantity = recipeColumns.some((col) => col.name === "servingsQuantity");
const hasServingsUnit = recipeColumns.some((col) => col.name === "servingsUnit");
if (!hasServingsQuantity) {
  db.exec("ALTER TABLE recipes ADD COLUMN servingsQuantity TEXT DEFAULT '';");
}
if (!hasServingsUnit) {
  db.exec("ALTER TABLE recipes ADD COLUMN servingsUnit TEXT DEFAULT '';");
}

export const getSetting = (key, fallback = null) => {
  if (!key) return fallback;
  const stmt = db.prepare("SELECT value FROM settings WHERE key = ?");
  const row = stmt.get(key);
  if (!row) return fallback;
  return parseJson(row.value, fallback);
};

export const setSetting = (key, value) => {
  if (!key) return null;
  const stmt = db.prepare(
    "INSERT INTO settings (key, value, updatedAt) VALUES (@key, @value, @updatedAt) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt"
  );
  const payload = {
    key,
    value: JSON.stringify(value ?? null),
    updatedAt: new Date().toISOString(),
  };
  stmt.run(payload);
  return getSetting(key, null);
};

export const getAllSettings = () => {
  const stmt = db.prepare("SELECT key, value FROM settings");
  const rows = stmt.all();
  const settings = {};
  rows.forEach((row) => {
    settings[row.key] = parseJson(row.value, null);
  });
  return settings;
};

const rowToRecipe = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  author: row.author || "",
  createdAt: row.createdAt,
  tags: parseJson(row.tags, []),
  ingredients: parseJson(row.ingredients, []),
  steps: parseJson(row.steps, []),
  ownerId: row.ownerId || "",
  isPublic: Boolean(row.isPublic),
  notes: row.notes || "",
  servingsQuantity: row.servingsQuantity || "",
  servingsUnit: row.servingsUnit || "",
});

const serializeRecipe = (recipe) => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description ?? "",
  author: recipe.author ?? "",
  createdAt: recipe.createdAt,
  tags: JSON.stringify(recipe.tags ?? []),
  ingredients: JSON.stringify(recipe.ingredients ?? []),
  steps: JSON.stringify(recipe.steps ?? []),
  ownerId: recipe.ownerId ?? "",
  isPublic: recipe.isPublic ? 1 : 0,
  notes: recipe.notes ?? "",
  servingsQuantity: recipe.servingsQuantity ?? "",
  servingsUnit: recipe.servingsUnit ?? "",
});

export const getRecipesForOwner = (ownerId) => {
  if (!ownerId) return [];
  const stmt = db.prepare("SELECT * FROM recipes WHERE ownerId = ? ORDER BY title COLLATE NOCASE");
  return stmt.all(ownerId).map(rowToRecipe);
};

export const getRecipeByIdAnyOwner = (id) => {
  const stmt = db.prepare("SELECT * FROM recipes WHERE id = ?");
  const row = stmt.get(id);
  return row ? rowToRecipe(row) : null;
};

export const getRecipeById = (id, ownerId) => {
  const stmt = db.prepare("SELECT * FROM recipes WHERE id = ? AND ownerId = ?");
  const row = stmt.get(id, ownerId);
  return row ? rowToRecipe(row) : null;
};

export const saveRecipe = (recipe) => {
  const upsertStmt = db.prepare(`
    INSERT INTO recipes (id, title, description, author, createdAt, tags, ingredients, steps, ownerId, isPublic, notes, servingsQuantity, servingsUnit)
    VALUES (@id, @title, @description, @author, @createdAt, @tags, @ingredients, @steps, @ownerId, @isPublic, @notes, @servingsQuantity, @servingsUnit)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      description=excluded.description,
      author=excluded.author,
      createdAt=excluded.createdAt,
      tags=excluded.tags,
      ingredients=excluded.ingredients,
      steps=excluded.steps,
      ownerId=excluded.ownerId,
      isPublic=excluded.isPublic,
      notes=excluded.notes,
      servingsQuantity=excluded.servingsQuantity,
      servingsUnit=excluded.servingsUnit
  `);
  upsertStmt.run(serializeRecipe(recipe));
  return getRecipeById(recipe.id, recipe.ownerId);
};

export const deleteRecipe = (id, ownerId) => {
  const stmt = db.prepare("DELETE FROM recipes WHERE id = ? AND ownerId = ?");
  const info = stmt.run(id, ownerId);
  return info.changes > 0;
};

const userColumns = "id, username, role, createdAt, passwordHash";
const userSafeColumns = "id, username, role, createdAt";

export const findUserByUsername = (username) => {
  const stmt = db.prepare(`SELECT ${userColumns} FROM users WHERE username = ?`);
  return stmt.get(username) || null;
};

export const findUserById = (id) => {
  const stmt = db.prepare(`SELECT ${userColumns} FROM users WHERE id = ?`);
  return stmt.get(id) || null;
};

export const getUsers = () => {
  const stmt = db.prepare(`SELECT ${userSafeColumns} FROM users ORDER BY createdAt ASC`);
  return stmt.all();
};

export const createUser = ({ id, username, passwordHash, role, createdAt }) => {
  const stmt = db.prepare(
    "INSERT INTO users (id, username, passwordHash, role, createdAt) VALUES (@id, @username, @passwordHash, @role, @createdAt)"
  );
  stmt.run({ id, username, passwordHash, role, createdAt });
  return findUserById(id);
};

export const deleteUser = (id) => {
  const stmt = db.prepare("DELETE FROM users WHERE id = ?");
  const info = stmt.run(id);
  return info.changes > 0;
};

export const updateUserRole = (id, role) => {
  const stmt = db.prepare("UPDATE users SET role = ? WHERE id = ?");
  const info = stmt.run(role, id);
  return info.changes > 0;
};

const randomToken = () => crypto.randomUUID().replace(/-/g, "");

export const getPublicShare = (recipeId) => {
  const stmt = db.prepare("SELECT * FROM recipe_shares WHERE recipeId = ? AND type = 'public' LIMIT 1");
  return stmt.get(recipeId) || null;
};

export const upsertPublicShare = (recipeId) => {
  const existing = getPublicShare(recipeId);
  if (existing) return existing;
  const payload = {
    id: crypto.randomUUID(),
    recipeId,
    token: randomToken(),
    type: "public",
    userId: null,
    canEdit: 0,
    createdAt: new Date().toISOString(),
  };
  const stmt = db.prepare(
    "INSERT INTO recipe_shares (id, recipeId, token, type, userId, canEdit, createdAt) VALUES (@id, @recipeId, @token, @type, @userId, @canEdit, @createdAt)"
  );
  stmt.run(payload);
  return payload;
};

export const removePublicShare = (recipeId) => {
  const stmt = db.prepare("DELETE FROM recipe_shares WHERE recipeId = ? AND type = 'public'");
  stmt.run(recipeId);
};

export const upsertUserShare = (recipeId, userId, canEdit = false) => {
  const existing = db
    .prepare("SELECT * FROM recipe_shares WHERE recipeId = ? AND userId = ? AND type = 'user'")
    .get(recipeId, userId);
  if (existing) {
    const stmt = db.prepare("UPDATE recipe_shares SET canEdit = ? WHERE id = ?");
    stmt.run(canEdit ? 1 : 0, existing.id);
    return { ...existing, canEdit: canEdit ? 1 : 0 };
  }
  const payload = {
    id: crypto.randomUUID(),
    recipeId,
    token: randomToken(),
    type: "user",
    userId,
    canEdit: canEdit ? 1 : 0,
    createdAt: new Date().toISOString(),
  };
  const stmt = db.prepare(
    "INSERT INTO recipe_shares (id, recipeId, token, type, userId, canEdit, createdAt) VALUES (@id, @recipeId, @token, @type, @userId, @canEdit, @createdAt)"
  );
  stmt.run(payload);
  return payload;
};

export const deleteUserShare = (recipeId, userId) => {
  const stmt = db.prepare("DELETE FROM recipe_shares WHERE recipeId = ? AND userId = ? AND type = 'user'");
  stmt.run(recipeId, userId);
};

export const listSharesForRecipe = (recipeId) => {
  const stmt = db.prepare("SELECT * FROM recipe_shares WHERE recipeId = ? ORDER BY createdAt DESC");
  return stmt.all(recipeId) || [];
};

export const getShareByToken = (token) => {
  const stmt = db.prepare("SELECT * FROM recipe_shares WHERE token = ?");
  return stmt.get(token) || null;
};

export const listSharedRecipesForUser = (userId) => {
  if (!userId) return [];
  const stmt = db.prepare(`
    SELECT rs.id as shareId, rs.token, rs.canEdit, rs.createdAt as sharedAt,
           r.*, u.username as ownerUsername
    FROM recipe_shares rs
    JOIN recipes r ON r.id = rs.recipeId
    JOIN users u ON u.id = r.ownerId
    WHERE rs.type = 'user' AND rs.userId = ?
    ORDER BY r.title COLLATE NOCASE
  `);
  return stmt.all(userId).map((row) => ({
    ...rowToRecipe(row),
    shareId: row.shareId,
    shareToken: row.token,
    canEdit: Boolean(row.canEdit),
    sharedAt: row.sharedAt,
    ownerUsername: row.ownerUsername || "",
  }));
};

export const countOwners = () => {
  const stmt = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'owner'");
  return stmt.get().total || 0;
};

const sessionWithUserStmt = db.prepare(`
  SELECT sessions.id as sessionId, sessions.userId, sessions.createdAt as sessionCreatedAt, sessions.expiresAt,
         users.id, users.username, users.role, users.createdAt
  FROM sessions
  JOIN users ON users.id = sessions.userId
  WHERE sessions.id = ?
`);

export const getSessionWithUser = (sessionId) => {
  if (!sessionId) return null;
  const row = sessionWithUserStmt.get(sessionId);
  if (!row) return null;

  const now = new Date();
  const expires = new Date(row.expiresAt);
  if (expires < now) {
    deleteSession(sessionId);
    return null;
  }

  return {
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
    user: {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.createdAt,
    },
  };
};

export const createSession = (userId, ttlMs) => {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  const stmt = db.prepare(
    "INSERT INTO sessions (id, userId, createdAt, expiresAt) VALUES (@id, @userId, @createdAt, @expiresAt)"
  );
  stmt.run({
    id,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  return { id, expiresAt: expiresAt.toISOString() };
};

export const deleteSession = (sessionId) => {
  const stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
  stmt.run(sessionId);
};

export const purgeUserSessions = (userId) => {
  const stmt = db.prepare("DELETE FROM sessions WHERE userId = ?");
  stmt.run(userId);
};

const generateJoinCodeValue = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  while (code.length < 7) {
    const idx = Math.floor(Math.random() * alphabet.length);
    code += alphabet[idx];
  }
  return code;
};

const normalizeJoinCodeInput = (code) => (code || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();

export const normalizeJoinCode = normalizeJoinCodeInput;

export const deleteJoinCode = (code) => {
  const normalized = normalizeJoinCodeInput(code);
  const stmt = db.prepare("DELETE FROM join_codes WHERE code = ?");
  stmt.run(normalized);
};

export const deleteOwnerJoinCodes = () => {
  const stmt = db.prepare("DELETE FROM join_codes WHERE role = 'owner'");
  stmt.run();
};

export const getOwnerJoinCodes = () => {
  const stmt = db.prepare("SELECT * FROM join_codes WHERE role = 'owner'");
  return stmt.all();
};

export const createJoinCode = ({ role, createdBy, expiresAt, maxUses = 1 }) => {
  let code = generateJoinCodeValue();
  const existsStmt = db.prepare("SELECT 1 FROM join_codes WHERE code = ?");
  while (existsStmt.get(code)) {
    code = generateJoinCodeValue();
  }

  const stmt = db.prepare(
    "INSERT INTO join_codes (code, role, createdAt, createdBy, expiresAt, maxUses, usedCount) VALUES (@code, @role, @createdAt, @createdBy, @expiresAt, @maxUses, 0)"
  );
  stmt.run({
    code,
    role,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || null,
    expiresAt: expiresAt || null,
    maxUses: Math.max(1, maxUses || 1),
  });
  return code;
};

export const consumeJoinCode = (code) => {
  const normalized = normalizeJoinCodeInput(code);
  if (normalized.length !== 7) return null;
  const stmt = db.prepare("SELECT * FROM join_codes WHERE code = ?");
  const record = stmt.get(normalized);
  if (!record) return null;

  const now = new Date();
  if (record.expiresAt && new Date(record.expiresAt) < now) {
    deleteJoinCode(normalized);
    return null;
  }
  if (record.usedCount >= record.maxUses) {
    deleteJoinCode(normalized);
    return null;
  }

  return record;
};

export const markJoinCodeUsed = (code, userId) => {
  const normalized = normalizeJoinCodeInput(code);
  const stmt = db.prepare(
    "UPDATE join_codes SET usedBy = @userId, usedAt = @usedAt, usedCount = usedCount + 1 WHERE code = @code"
  );
  const info = stmt.run({
    userId,
    usedAt: new Date().toISOString(),
    code: normalized,
  });

  if (info.changes > 0) {
    const updated = db.prepare("SELECT usedCount, maxUses FROM join_codes WHERE code = ?").get(normalized);
    if (updated && updated.usedCount >= updated.maxUses) {
      deleteJoinCode(normalized);
    }
  }

  return info.changes > 0;
};

export const listJoinCodes = () => {
  const stmt = db.prepare(
    "SELECT code, role, createdAt, createdBy, usedBy, usedAt, expiresAt, maxUses, usedCount FROM join_codes"
  );
  return stmt.all();
};

export const ensureOwnerJoinCode = () => {
  if (countOwners() > 0) return null;
  const existing = getOwnerJoinCodes();
  const code = existing.length ? existing[0].code : createJoinCode({ role: "owner" });
  const printable = `${code.slice(0, 4)}-${code.slice(4)}`;
  console.log(`[auth] No owner found. Use join code ${printable} for the first signup to become owner.`);
  return code;
};
