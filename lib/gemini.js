const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    const blockReason = data?.promptFeedback?.blockReason;
    const finishReason = data?.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini returned an empty response. blockReason=${String(
        blockReason
      )} finishReason=${String(finishReason)}`
    );
  }

  return text;
}

/**
 * Calls generateWithGemini with simple exponential backoff on failure.
 * @param {string} prompt
 * @param {object} options
 * @param {number} [options.maxRetries=3]
 * @param {number} [options.retryDelayMs=2000] base delay; multiplied by attempt index
 */
async function generateWithGeminiWithRetry(prompt, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 2000;
  const { maxRetries: _mr, retryDelayMs: _rd, ...geminiOptions } = options;

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await generateWithGemini(prompt, geminiOptions);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Gemini request failed (attempt ${attempt}/${maxRetries}): ${message}`
      );
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }
  throw lastError;
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  generateWithGemini,
  generateWithGeminiWithRetry
};
