import crypto from "node:crypto";

const LLM_ENDPOINT = "https://dev.aqanta.com/v1/chat/completions";
const MODEL = "GPT-OSS-20B";

const SYSTEM_PROMPT = `You are a careful recipe extraction assistant.
From the user's pasted text, return ONLY valid JSON with this shape:
{
  "title": string,
  "description": string,
  "author": string,
  "tags": string[],
  "ingredients": [{ "name": string, "quantity": string, "unit": string }],
  "steps": string[]
}
Rules:
- Include ALL ingredients you can find; do not omit items. If many exist, include them all.
- Include ALL preparation steps in the original order; short, direct instructions.
- Fill "quantity" and "unit" when possible; if unknown, keep them as empty strings.
- Standardized ingredients (remove brand names, etc.)
- If there is no title or description provided, choose one
- Provide 3-4 concise tags focused on meal type and main ingredients (e.g., "dinner", "dessert", "pumpkin", "chicken", "pasta"); omit dietary labels unless given.
- Units must be chosen ONLY from this list: ["cup","tbsp","tsp","g","kg","oz","ml","l","piece","pinch"]. Convert close variants (cups, tablespoons, tsp., etc.) to the closest allowed unit. If you cannot map it, leave unit as an empty string.
- Express customary measurements as simple fractions where applicable (e.g., 1/2, 1/3, 1/4, 3/4).
- Use empty strings/arrays when something is missing.
- Do NOT add extra fields beyond the JSON shape. Respond with JSON only, no prose.`;

const jsonFromText = (text) => {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/({[\s\S]*})/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return {};
      }
    }
    return {};
  }
};

const arrayFrom = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value.split(/[\n,]+/).map((item) => item.trim());
  }
  return [];
};

const normalizeUnit = (unit) => {
  const allowed = ["cup", "tbsp", "tsp", "g", "kg", "oz", "ml", "l", "piece", "pinch"];
  if (!unit) return "";
  const key = unit.toString().toLowerCase().replace(/\./g, "").trim();
  const mapping = {
    c: "cup",
    cup: "cup",
    cups: "cup",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tbsp: "tbsp",
    tbs: "tbsp",
    tablespoonful: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tsp: "tsp",
    tsps: "tsp",
    gram: "g",
    grams: "g",
    g: "g",
    kilogram: "kg",
    kilograms: "kg",
    kg: "kg",
    kgs: "kg",
    ounce: "oz",
    ounces: "oz",
    oz: "oz",
    milliliter: "ml",
    milliliters: "ml",
    ml: "ml",
    liter: "l",
    litres: "l",
    litre: "l",
    l: "l",
    piece: "piece",
    pieces: "piece",
    pc: "piece",
    pcs: "piece",
    pinch: "pinch",
    pinches: "pinch",
  };
  const normalized = mapping[key];
  if (normalized && allowed.includes(normalized)) return normalized;
  if (allowed.includes(key)) return key;
  return "";
};

const normalizeIngredient = (item) => {
  const sentenceCase = (value) => {
    const str = (value || "").toString().trim();
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const base =
    typeof item === "string"
      ? { name: item.trim(), quantity: "", unit: "" }
      : {
          name: item?.name?.trim() || "",
          quantity: (item?.quantity ?? "").toString().trim(),
          unit: item?.unit?.trim() || "",
        };

  return {
    id: item?.id || crypto.randomUUID(),
    name: sentenceCase(base.name),
    quantity: base.quantity,
    unit: normalizeUnit(base.unit),
  };
};

const normalizeIngredients = (value) =>
  arrayFrom(value)
    .map((item) => normalizeIngredient(item))
    .filter((item) => item.name || item.quantity || item.unit);

const normalizeSteps = (value) =>
  arrayFrom(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const candidate =
          item.step ?? item.text ?? item.description ?? item.instruction ?? item.content ?? item.name ?? "";
        return typeof candidate === "string" ? candidate.trim() : "";
      }
      return "";
    })
    .filter(Boolean);

const normalizeRecipe = (payload) => {
  const data = payload || {};
  const steps = normalizeSteps(data.steps);
  const ingredients = normalizeIngredients(data.ingredients);
  const tags = arrayFrom(data.tags)
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);

  return {
    title: data.title?.trim() || "",
    description: data.description?.trim() || "",
    author: data.author?.trim() || "",
    tags,
    ingredients,
    steps: steps.map((step) => step.trim()).filter(Boolean),
  };
};

export const buildRecipeFromText = async (text) => {
  if (!text?.trim()) throw new Error("No text provided for import.");
  const response = await fetch(LLM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the recipe details from the following pasted text. Respond with JSON only.\n\n${text}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const msg = `LLM request failed with status ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const parsed = jsonFromText(content);
  return normalizeRecipe(parsed);
};
