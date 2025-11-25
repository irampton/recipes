import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { buildRecipeFromText } from "./LLM.js";
import * as db from "./db.js";
import * as auth from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});

app.use(express.json());
app.use(auth.attachSession);

const distDir = path.resolve(__dirname, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

const normalizeRecipe = (incoming) => {
  const now = new Date().toISOString();
  const servings = incoming.servings || {};
  const servingQuantity =
    incoming.servingsQuantity?.trim?.() ||
    servings.quantity?.toString?.().trim?.() ||
    (typeof servings === "string" ? servings.trim() : "");
  const servingUnit = incoming.servingsUnit?.trim?.() || servings.unit?.toString?.().trim?.() || "";
  return {
    id: incoming.id || crypto.randomUUID(),
    title: incoming.title?.trim() || "Untitled Recipe",
    description: incoming.description?.trim() || "",
    author: incoming.author?.trim() || "",
    createdAt: incoming.createdAt || now,
    tags: (incoming.tags || [])
      .map((tag) => (tag || "").trim())
      .filter(Boolean),
    ingredients: (incoming.ingredients || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      name: item.name?.trim() || "",
      quantity: item.quantity ?? "",
      unit: item.unit || "",
    })),
    steps: (incoming.steps || []).map((step) => step?.trim()).filter(Boolean),
    ownerId: incoming.ownerId?.trim?.() || incoming.ownerID?.trim?.() || "",
    isPublic: Boolean(incoming.isPublic),
    notes: incoming.notes?.trim?.() || "",
    servingsQuantity: servingQuantity,
    servingsUnit: servingUnit,
  };
};

const getLlmSettings = () => {
  const raw = db.getSetting("llm", null) || {};
  return {
    enabled: Boolean(raw.enabled),
    endpoint: (raw.endpoint || "").trim(),
  };
};

const bootstrapLlmSettingsFromEnv = () => {
  const envEndpoint = (process.env.LLM_ENDPOINT || "").trim();
  if (!envEndpoint) return;
  db.setSetting("llm", { enabled: true, endpoint: envEndpoint });
};

if (!fs.existsSync(indexHtmlPath)) {
  console.warn("Vite build not found. Run `npm run build` to generate client assets.");
}

app.use(express.static(distDir));

bootstrapLlmSettingsFromEnv();

app.post("/api/llm-import", auth.requireAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ success: false, error: "Please provide some text to import." });
    return;
  }

  const llmSettings = getLlmSettings();
  if (!llmSettings.enabled || !llmSettings.endpoint) {
    res.status(400).json({ success: false, error: "LLM import is disabled." });
    return;
  }

  try {
    const recipe = await buildRecipeFromText(text, { endpoint: llmSettings.endpoint });
    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error("[llm] import failed:", error);
    res.status(500).json({ success: false, error: "Unable to import recipe right now." });
  }
});

app.get("/api/settings", auth.requireAuth, (req, res) => {
  res.json({ success: true, settings: { llm: getLlmSettings() } });
});

app.put("/api/admin/settings/llm", auth.requireAdmin, (req, res) => {
  const { enabled, endpoint } = req.body || {};
  const normalized = {
    enabled: Boolean(enabled),
    endpoint: (endpoint || "").trim(),
  };
  db.setSetting("llm", normalized);
  res.json({ success: true, settings: { llm: normalized } });
});

app.post("/api/signup", auth.signupHandler);
app.post("/api/login", auth.loginHandler);
app.post("/api/logout", auth.logoutHandler);
app.get("/api/me", auth.meHandler);

app.get("/api/users/search", auth.requireAuth, (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  if (!q) {
    res.json({ success: true, users: [] });
    return;
  }
  const all = db.getUsers();
  const matches = all
    .filter((u) => u.username.toLowerCase().includes(q))
    .slice(0, 10);
  res.json({ success: true, users: matches });
});

app.get("/api/shared-recipes", auth.requireAuth, (req, res) => {
  const recipes = db.listSharedRecipesForUser(req.user.id);
  res.json({ success: true, recipes });
});

app.get("/api/users", auth.requireAdmin, (req, res) => {
  res.json({ success: true, users: db.getUsers() });
});

app.delete("/api/users/:id", auth.requireAdmin, (req, res) => {
  const targetId = req.params.id;
  if (!targetId) {
    res.status(400).json({ success: false, error: "Missing user id." });
    return;
  }
  if (targetId === req.user.id) {
    res.status(400).json({ success: false, error: "You cannot remove your own account." });
    return;
  }

  const users = db.getUsers();
  const target = users.find((u) => u.id === targetId);
  if (!target) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }

  if (target.role === "owner") {
    res.status(403).json({ success: false, error: "Cannot delete the owner." });
    return;
  }

  if (target.role === "admin" && req.user.role !== "owner") {
    res.status(403).json({ success: false, error: "Only owner can remove admins." });
    return;
  }

  const removed = db.deleteUser(targetId);
  if (!removed) {
    res.status(500).json({ success: false, error: "Unable to remove user." });
    return;
  }
  res.json({ success: true });
});

app.get("/api/recipes/:id/shares", auth.requireAuth, (req, res) => {
  const { id } = req.params;
  const recipe = db.getRecipeById(id, req.user.id);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  const shares = db.listSharesForRecipe(id);
  const userShares = shares.filter((s) => s.type === "user");
  const withNames = userShares.map((s) => {
    const user = db.findUserById(s.userId);
    return { ...s, username: user?.username || "Unknown" };
  });
  const publicShare = shares.find((s) => s.type === "public") || null;
  res.json({ success: true, shares: { publicShare, userShares: withNames } });
});

app.post("/api/recipes/:id/share/public", auth.requireAuth, (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body || {};
  const recipe = db.getRecipeById(id, req.user.id);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  if (enabled) {
    const share = db.upsertPublicShare(id);
    db.saveRecipe({ ...recipe, isPublic: true });
    res.json({ success: true, share });
  } else {
    db.removePublicShare(id);
    db.saveRecipe({ ...recipe, isPublic: false });
    res.json({ success: true, share: null });
  }
});

app.post("/api/recipes/:id/share/user", auth.requireAuth, (req, res) => {
  const { id } = req.params;
  const { userId, canEdit } = req.body || {};
  const recipe = db.getRecipeById(id, req.user.id);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  if (!userId) {
    res.status(400).json({ success: false, error: "Missing user id." });
    return;
  }
  const targetUser = db.findUserById(userId);
  if (!targetUser) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }
  const share = db.upsertUserShare(id, userId, Boolean(canEdit));
  res.json({ success: true, share: { ...share, username: targetUser.username } });
});

app.delete("/api/recipes/:id/share/user/:userId", auth.requireAuth, (req, res) => {
  const { id, userId } = req.params;
  const recipe = db.getRecipeById(id, req.user.id);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  db.deleteUserShare(id, userId);
  res.json({ success: true });
});

app.get("/api/share/:token", async (req, res) => {
  const { token } = req.params;
  const share = db.getShareByToken(token);
  if (!share) {
    res.status(404).json({ success: false, error: "Share not found." });
    return;
  }
  const recipe = db.getRecipeByIdAnyOwner(share.recipeId);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  if (share.type === "user" && (!req.user || req.user.id !== share.userId) && (!req.user || req.user.id !== recipe.ownerId)) {
    res.status(403).json({ success: false, error: "Unauthorized to view this recipe." });
    return;
  }
  res.json({
    success: true,
    recipe: { ...recipe, isPublic: share.type === "public" || recipe.isPublic },
    permissions: {
      canEdit:
        (req.user && req.user.id === recipe.ownerId) ||
        (Boolean(share.canEdit) && (!share.userId || (req.user && req.user.id === share.userId))),
      type: share.type,
    },
  });
});

app.put("/api/share/:token", async (req, res) => {
  const { token } = req.params;
  const share = db.getShareByToken(token);
  if (!share) {
    res.status(404).json({ success: false, error: "Share not found." });
    return;
  }
  const recipe = db.getRecipeByIdAnyOwner(share.recipeId);
  if (!recipe) {
    res.status(404).json({ success: false, error: "Recipe not found." });
    return;
  }
  const isOwner = req.user && req.user.id === recipe.ownerId;
  const canEdit = isOwner || (Boolean(share.canEdit) && (share.userId ? req.user && req.user.id === share.userId : true));
  if (!canEdit) {
    res.status(403).json({ success: false, error: "You cannot edit this recipe." });
    return;
  }
  const normalized = normalizeRecipe({
    ...recipe,
    ...req.body,
    id: recipe.id,
    ownerId: recipe.ownerId,
    isPublic: recipe.isPublic,
  });
  const saved = db.saveRecipe(normalized);
  res.json({ success: true, recipe: saved });
});
app.patch("/api/users/:id/role", auth.requireOwner, (req, res) => {
  const targetId = req.params.id;
  const { role } = req.body || {};
  if (!targetId || !role || !["admin", "user"].includes(role)) {
    res.status(400).json({ success: false, error: "Invalid request." });
    return;
  }
  const users = db.getUsers();
  const target = users.find((u) => u.id === targetId);
  if (!target) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }
  if (target.role === "owner") {
    res.status(403).json({ success: false, error: "Cannot change owner role." });
    return;
  }
  const updated = db.updateUserRole(targetId, role);
  if (!updated) {
    res.status(500).json({ success: false, error: "Unable to update role." });
    return;
  }
  res.json({ success: true });
});

app.get("/api/join-codes", auth.requireAdmin, (req, res) => {
  res.json({ success: true, joinCodes: db.listJoinCodes() });
});

app.post("/api/join-codes", auth.requireAdmin, (req, res) => {
  const { role, expiresAt, maxUses } = req.body || {};
  if (!role || !["user", "admin"].includes(role)) {
    res.status(400).json({ success: false, error: "Invalid role for join code." });
    return;
  }
  if (role === "admin" && req.user.role !== "owner") {
    res.status(403).json({ success: false, error: "Only the owner can create admin join codes." });
    return;
  }
  const parsedMaxUses = Number(maxUses) || 1;
  const safeMaxUses = parsedMaxUses < 1 ? 1 : Math.min(parsedMaxUses, 50);
  let expiresIso = null;
  if (expiresAt) {
    const parsed = new Date(expiresAt);
    if (!Number.isNaN(parsed.getTime())) {
      expiresIso = parsed.toISOString();
    }
  }
  const code = db.createJoinCode({ role, createdBy: req.user.id, expiresAt: expiresIso, maxUses: safeMaxUses });
  res.json({ success: true, code });
});

app.delete("/api/join-codes/:code", auth.requireAdmin, (req, res) => {
  const { code } = req.params;
  const normalized = db.normalizeJoinCode(code);
  if (!normalized) {
    res.status(400).json({ success: false, error: "Invalid code." });
    return;
  }
  db.deleteJoinCode(normalized);
  res.json({ success: true });
});

io.use(auth.socketAuth);

io.on("connection", (socket) => {
  const user = socket.data.user;
  const recipes = db.getRecipesForOwner(user.id);
  socket.emit("recipes:updated", recipes);

  socket.on("recipes:list", (ack) => {
    if (typeof ack === "function") {
      ack({ success: true, data: db.getRecipesForOwner(user.id) });
    }
  });

  socket.on("recipe:save", (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const incoming = payload || {};

    if (!incoming.title) {
      reply({ success: false, error: "Title is required." });
      return;
    }

    const normalized = normalizeRecipe(incoming);
    normalized.ownerId = user.id;
    if (!normalized.author) {
      normalized.author = user.username || "";
    }
    const saved = db.saveRecipe(normalized);
    const updatedList = db.getRecipesForOwner(user.id);

    socket.emit("recipes:updated", updatedList);
    reply({ success: true, data: saved });
  });

  socket.on("recipe:delete", (id, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (!id) {
      reply({ success: false, error: "Missing recipe id." });
      return;
    }
    const removed = db.deleteRecipe(id, user.id);
    if (!removed) {
      reply({ success: false, error: "Recipe not found." });
      return;
    }
    const updatedList = db.getRecipesForOwner(user.id);
    socket.emit("recipes:updated", updatedList);
    reply({ success: true });
  });
});

app.get("/{*splat}", (req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(503).send("Client build not found. Please run `npm run build`.");
  }
});

server.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
  db.ensureOwnerJoinCode();
});
