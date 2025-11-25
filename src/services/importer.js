export const importRecipeFromText = async (input) => {
  const payload = typeof input === "string" ? { text: input } : input || {};
  const response = await fetch("/api/llm-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const errorMessage = data?.error || "Unable to import recipe.";
    throw new Error(errorMessage);
  }

  return data.data;
};
