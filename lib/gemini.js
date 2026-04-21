const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

async function generateWithGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const model = options.model || DEFAULT_GEMINI_MODEL;
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  if (options.generationConfig) {
    payload.generationConfig = options.generationConfig;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  generateWithGemini
};
