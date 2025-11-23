import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { buildRecipeFromText } from "./LLM.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, "recipes-data.json");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});

app.use(express.json());

const distDir = path.resolve(__dirname, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
  }
};

const readRecipes = () => {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[data] Failed to read recipes file:", error);
    return [];
  }
};

const writeRecipes = (recipes) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2), "utf8");
  } catch (error) {
    console.error("[data] Failed to write recipes file:", error);
  }
};

const sortByTitle = (list) =>
  [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));

let recipes = sortByTitle(readRecipes());

const normalizeRecipe = (incoming) => {
  const now = new Date().toISOString();
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
  };
};

if (!fs.existsSync(indexHtmlPath)) {
  console.warn("Vite build not found. Run `npm run build` to generate client assets.");
}

app.use(express.static(distDir));

app.post("/api/llm-import", async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) {
    res.status(400).json({ success: false, error: "Please provide some text to import." });
    return;
  }

  try {
    const recipe = await buildRecipeFromText(text);
    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error("[llm] import failed:", error);
    res.status(500).json({ success: false, error: "Unable to import recipe right now." });
  }
});

io.on("connection", (socket) => {
  socket.emit("recipes:updated", recipes);

  socket.on("recipes:list", (ack) => {
    if (typeof ack === "function") {
      ack({ success: true, data: recipes });
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
    const existingIndex = recipes.findIndex((r) => r.id === normalized.id);

    if (existingIndex >= 0) {
      recipes[existingIndex] = { ...recipes[existingIndex], ...normalized };
    } else {
      recipes.push(normalized);
    }

    recipes = sortByTitle(recipes);
    writeRecipes(recipes);

    io.emit("recipes:updated", recipes);
    reply({ success: true, data: normalized });
  });

  socket.on("recipe:delete", (id, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (!id) {
      reply({ success: false, error: "Missing recipe id." });
      return;
    }
    const idx = recipes.findIndex((r) => r.id === id);
    if (idx === -1) {
      reply({ success: false, error: "Recipe not found." });
      return;
    }
    recipes.splice(idx, 1);
    writeRecipes(recipes);
    io.emit("recipes:updated", recipes);
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
});
