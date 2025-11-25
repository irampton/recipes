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

const emitFriendUpdate = (userId) => {
  if (!userId) return;
  io.to(`user:${userId}`).emit("friends:updated");
};

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
  const friendsOnly = req.query.scope === "friends" || req.query.friendsOnly === "true";
  if (!q) {
    res.json({ success: true, users: [] });
    return;
  }
  const userList = friendsOnly
    ? db.listFriendsForUser(req.user.id).map((friend) => ({ id: friend.userId, username: friend.username }))
    : db
        .getUsers()
        .filter((u) => u.id !== req.user.id)
        .map((u) => ({ id: u.id, username: u.username }));

  const matches = userList.filter((u) => u.username.toLowerCase().includes(q)).slice(0, 10);
  res.json({ success: true, users: matches });
});

app.get("/api/friends", auth.requireAuth, (req, res) => {
  const friends = db.listFriendsForUser(req.user.id);
  const requests = db.listFriendRequests(req.user.id);
  res.json({ success: true, friends, requests });
});

app.get("/api/friends/search", auth.requireAuth, (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();
  if (!q) {
    res.json({ success: true, users: [] });
    return;
  }
  const friends = db.listFriendsForUser(req.user.id);
  const friendIds = new Set(friends.map((f) => f.userId));
  const pending = db.listFriendRequests(req.user.id);
  const incomingIds = new Set((pending.incoming || []).map((r) => r.fromUserId));
  const outgoingIds = new Set((pending.outgoing || []).map((r) => r.toUserId));

  const users = db
    .getUsers()
    .filter((u) => u.id !== req.user.id && u.username.toLowerCase().includes(q))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      username: u.username,
      isFriend: friendIds.has(u.id),
      incomingRequest: incomingIds.has(u.id),
      outgoingRequest: outgoingIds.has(u.id),
    }));

  res.json({ success: true, users });
});

app.post("/api/friend-requests", auth.requireAuth, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    res.status(400).json({ success: false, error: "Missing user id." });
    return;
  }
  if (userId === req.user.id) {
    res.status(400).json({ success: false, error: "You cannot friend yourself." });
    return;
  }
  const target = db.findUserById(userId);
  if (!target) {
    res.status(404).json({ success: false, error: "User not found." });
    return;
  }
  if (db.areFriends(req.user.id, userId)) {
    res.status(400).json({ success: false, error: "You are already friends." });
    return;
  }

  const opposite = db.findPendingFriendRequest(userId, req.user.id);
  if (opposite) {
    db.setFriendRequestStatus(opposite.id, "accepted");
    db.markRequestsAcceptedBetween(req.user.id, userId);
    const friendship = db.addFriendship(req.user.id, userId);
    emitFriendUpdate(req.user.id);
    emitFriendUpdate(userId);
    res.json({ success: true, friendship, autoAccepted: true });
    return;
  }

  const request = db.upsertFriendRequest(req.user.id, userId);
  emitFriendUpdate(req.user.id);
  emitFriendUpdate(userId);
  res.json({ success: true, request });
});

app.post("/api/friend-requests/:id/accept", auth.requireAuth, (req, res) => {
  const request = db.getFriendRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, error: "Request not found." });
    return;
  }
  if (request.toUserId !== req.user.id) {
    res.status(403).json({ success: false, error: "You cannot accept this request." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ success: false, error: "This request has already been handled." });
    return;
  }

  db.setFriendRequestStatus(request.id, "accepted");
  db.markRequestsAcceptedBetween(request.fromUserId, request.toUserId);
  const friendship = db.addFriendship(request.fromUserId, request.toUserId);
  emitFriendUpdate(req.user.id);
  emitFriendUpdate(request.fromUserId);
  res.json({ success: true, friendship });
});

app.post("/api/friend-requests/:id/reject", auth.requireAuth, (req, res) => {
  const request = db.getFriendRequestById(req.params.id);
  if (!request) {
    res.status(404).json({ success: false, error: "Request not found." });
    return;
  }
  if (request.toUserId !== req.user.id) {
    res.status(403).json({ success: false, error: "You cannot reject this request." });
    return;
  }
  if (request.status !== "pending") {
    res.status(400).json({ success: false, error: "This request has already been handled." });
    return;
  }
  db.setFriendRequestStatus(request.id, "rejected");
  emitFriendUpdate(req.user.id);
  emitFriendUpdate(request.fromUserId);
  res.json({ success: true });
});

app.delete("/api/friends/:friendId", auth.requireAuth, (req, res) => {
  const friendId = req.params.friendId;
  if (!friendId) {
    res.status(400).json({ success: false, error: "Missing friend id." });
    return;
  }
  if (!db.areFriends(req.user.id, friendId)) {
    res.status(404).json({ success: false, error: "Not friends." });
    return;
  }
  const removed = db.removeFriendship(req.user.id, friendId);
  db.deleteSharesBetweenUsers(req.user.id, friendId);
  db.markRequestsAcceptedBetween(req.user.id, friendId);
  if (!removed) {
    res.status(500).json({ success: false, error: "Unable to remove friend." });
    return;
  }
  emitFriendUpdate(req.user.id);
  emitFriendUpdate(friendId);
  res.json({ success: true });
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
  const filteredShares = userShares.filter((s) => {
    const stillFriends = db.areFriends(recipe.ownerId, s.userId);
    if (!stillFriends) {
      db.deleteUserShare(id, s.userId);
    }
    return stillFriends;
  });
  const withNames = filteredShares.map((s) => {
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
  if (!db.areFriends(req.user.id, userId)) {
    res.status(400).json({ success: false, error: "You can only share recipes with friends." });
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
  if (share.type === "user") {
    const isOwner = req.user && req.user.id === recipe.ownerId;
    const isRecipient = req.user && req.user.id === share.userId;
    if (!isOwner && !isRecipient) {
      res.status(403).json({ success: false, error: "Unauthorized to view this recipe." });
      return;
    }
    if (!isOwner && !db.areFriends(req.user.id, recipe.ownerId)) {
      res.status(403).json({ success: false, error: "You must be friends to view this recipe." });
      return;
    }
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
  if (share.type === "user" && !isOwner) {
    if (!req.user || req.user.id !== share.userId) {
      res.status(403).json({ success: false, error: "You cannot edit this recipe." });
      return;
    }
    if (!db.areFriends(req.user.id, recipe.ownerId)) {
      res.status(403).json({ success: false, error: "You must be friends to edit this recipe." });
      return;
    }
  }
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
  socket.join(`user:${user.id}`);
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
