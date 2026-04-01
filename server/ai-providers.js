import { GoogleGenAI, Modality } from "@google/genai";

const ENV_KEY_MAP = {
  openrouter: ["OPENROUTER_API_KEY", "VITE_OPENROUTER_API_KEY"],
  nvidia: ["NVIDIA_API_KEY", "VITE_NVIDIA_API_KEY"],
  huggingface: ["HUGGINGFACE_API_KEY", "VITE_HUGGINGFACE_API_KEY"],
  gemini: ["GEMINI_API_KEY", "API_KEY", "VITE_GEMINI_API_KEY"],
};

function getEnvValue(names = []) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return "";
}

export function resolveProviderApiKey(providerId, explicitApiKey = "") {
  if (explicitApiKey) return explicitApiKey;
  return getEnvValue(ENV_KEY_MAP[providerId] || []);
}

function getGeminiClient() {
  const apiKey = resolveProviderApiKey("gemini");
  if (!apiKey) {
    throw new Error("Gemini API key is not configured on the server.");
  }
  return new GoogleGenAI({ apiKey });
}

// --- Schema Conversion ---

export function geminiSchemaToJsonSchema(schema) {
  if (!schema) return {};

  const typeMap = {
    STRING: "string",
    INTEGER: "integer",
    NUMBER: "number",
    OBJECT: "object",
    ARRAY: "array",
    BOOLEAN: "boolean",
    NULL: "null",
  };

  const result = {};
  if (schema.type) result.type = typeMap[schema.type] || schema.type;
  if (schema.description) result.description = schema.description;
  if (schema.enum) result.enum = schema.enum;

  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      result.properties[key] = geminiSchemaToJsonSchema(value);
    }
  }

  if (schema.required) result.required = schema.required;
  if (schema.items) result.items = geminiSchemaToJsonSchema(schema.items);

  if (result.type === "object" && result.properties) {
    result.additionalProperties = false;
    if (!result.required) {
      result.required = Object.keys(result.properties);
    }
  }

  return result;
}

// --- Helpers ---

function extractMessageText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .join("\n")
      .trim();
  }
  return String(content);
}

/** Extract JSON from text that may contain markdown fences or preamble */
function extractJsonFromText(text) {
  if (!text) return text;
  // Try markdown fenced block first
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Try raw JSON
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return jsonMatch ? jsonMatch[1] : text;
}

/** Estimate required max_tokens from schema complexity */
function estimateMaxTokens(responseSchema) {
  if (!responseSchema) return undefined;
  // Count schema depth/breadth as a proxy for output size
  let fieldCount = 0;
  const countFields = (schema) => {
    if (!schema) return;
    if (schema.properties) {
      for (const value of Object.values(schema.properties)) {
        fieldCount++;
        countFields(value);
      }
    }
    if (schema.items) countFields(schema.items);
  };
  countFields(responseSchema);
  // Rough heuristic: ~50 tokens per field, minimum 4096
  return Math.max(4096, Math.min(16384, fieldCount * 50));
}

// --- Text Generation: OpenAI-compatible providers ---

export async function generateWithProvider(provider, options) {
  const {
    prompt,
    system,
    responseSchema,
    jsonMode,
    images,
    temperature,
    maxTokens,
  } = options;

  const baseUrl = (provider.baseUrl || "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Provider baseUrl is required.");
  }

  const isOllama = provider.id === "ollama" || baseUrl.includes(":11434");
  const isOpenRouter = provider.id === "openrouter" || baseUrl.includes("openrouter.ai");
  const endpoint = isOllama ? `${baseUrl}/api/chat` : `${baseUrl}/chat/completions`;

  const tag = `[${provider.name || provider.id}/${provider.selectedModel}]`;
  console.log(`${tag} Starting request...`);
  const t0 = Date.now();

  // Build messages
  const messages = [];
  if (system) messages.push({ role: "system", content: system });

  if (images?.length) {
    const content = images.map((img) => ({
      type: "image_url",
      image_url: {
        url: img.data.startsWith("data:")
          ? img.data
          : `data:${img.mimeType};base64,${img.data}`,
      },
    }));
    content.push({ type: "text", text: prompt });
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  // Build request body
  const resolvedMaxTokens = maxTokens || estimateMaxTokens(responseSchema);
  const body = {
    model: provider.selectedModel,
    messages,
    temperature: temperature ?? 0.7,
    stream: false,
  };

  if (resolvedMaxTokens) body.max_tokens = resolvedMaxTokens;

  // JSON output handling — try json_schema for OpenRouter, json_object as fallback
  if (responseSchema) {
    if (isOllama) {
      body.format = "json";
    } else {
      const jsonSchema = geminiSchemaToJsonSchema(responseSchema);
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          strict: false,
          schema: jsonSchema,
        },
      };
    }
  } else if (jsonMode) {
    body.response_format = isOllama ? "json" : { type: "json_object" };
  }

  const headers = { "Content-Type": "application/json" };
  const apiKey = resolveProviderApiKey(provider.id, provider.apiKey);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // OpenRouter-specific headers for better routing
  if (isOpenRouter) {
    headers["HTTP-Referer"] = "https://ai-music-video-generator.local";
    headers["X-Title"] = "AI Music Video Generator";
  }

  // Request with timeout
  const controller = new AbortController();
  const timeoutMs = resolvedMaxTokens > 8000 ? 270_000 : 180_000; // 4.5min for big, 3min for small
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // OpenRouter :free model fallback on 404
    if (
      response.status === 404 &&
      isOpenRouter &&
      typeof body.model === "string" &&
      !body.model.includes(":")
    ) {
      console.log(`${tag} Model not found, retrying with :free suffix...`);
      body.model = `${body.model}:free`;
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    }

    // If json_schema is unsupported (400/422), retry with json_object
    if (
      (response.status === 400 || response.status === 422) &&
      body.response_format?.type === "json_schema"
    ) {
      const errorPreview = await response.text().catch(() => "");
      if (
        errorPreview.includes("json_schema") ||
        errorPreview.includes("response_format") ||
        errorPreview.includes("unsupported")
      ) {
        console.log(`${tag} json_schema not supported, falling back to json_object...`);
        body.response_format = { type: "json_object" };
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } else {
        // Re-throw original error
        const error = new Error(`${provider.name} API error ${response.status}: ${errorPreview}`);
        error.statusCode = response.status;
        error.providerId = provider.id;
        error.providerName = provider.name;
        error.upstreamBody = errorPreview;
        throw error;
      }
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      throw new Error(`${provider.name} request timed out after ${elapsed}s. The model may be overloaded or the request too large.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const error = new Error(`${provider.name} API error ${response.status}: ${errorText}`);
    error.statusCode = response.status;
    error.providerId = provider.id;
    error.providerName = provider.name;
    error.upstreamBody = errorText;
    throw error;
  }

  const data = await response.json();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Extract text — handle OpenAI and Ollama response shapes
  let text = extractMessageText(
    data.choices?.[0]?.message?.content || data.message?.content
  )
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .trim();

  if (!text) {
    throw new Error(`${provider.name} returned empty response after ${elapsed}s`);
  }

  // Token usage
  const usage = data.usage || {};
  const tokenUsage =
    (usage.prompt_tokens || usage.prompt_eval_count || 0) +
    (usage.completion_tokens || usage.eval_count || 0);

  const finishReason = data.choices?.[0]?.finish_reason;
  console.log(`${tag} Completed in ${elapsed}s — ${tokenUsage} tokens, finish: ${finishReason || "unknown"}`);

  // Warn if response was truncated
  if (finishReason === "length") {
    console.warn(`${tag} WARNING: Response was truncated (finish_reason=length). Output may be incomplete JSON.`);
  }

  // Extract JSON if schema or json mode was requested
  if (responseSchema || jsonMode) {
    const extracted = extractJsonFromText(text);
    // Validate it's parseable JSON
    try {
      JSON.parse(extracted);
      return { text: extracted, tokenUsage };
    } catch {
      console.warn(`${tag} Response is not valid JSON, returning raw text for caller to handle`);
      return { text: extracted, tokenUsage };
    }
  }

  return { text, tokenUsage };
}

// --- Text Generation: Gemini ---

export async function generateWithGemini(options) {
  const { prompt, responseSchema, geminiModel, geminiContents } = options;
  const ai = getGeminiClient();
  const config = {};

  if (responseSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = responseSchema;
  }

  const response = await ai.models.generateContent({
    model: geminiModel || "gemini-2.5-flash",
    contents: geminiContents || prompt,
    config,
  });

  return {
    text: response.text || "",
    tokenUsage: 0,
  };
}

// --- Image Generation ---

/**
 * Universal image URL extractor — handles all known provider response formats:
 *  - OpenRouter: choices[0].message.images[0].image_url (string or {url})
 *  - OpenAI:     data[0].b64_json or data[0].url
 *  - HuggingFace: top-level binary blob or [0].url
 *  - NVIDIA NIM:  data[0].b64_json
 *  - Generic:     image, imageUrl, url at top level
 */
function extractImageFromResponse(data, providerName = "Provider") {
  // Unwrap helper: handles both string and {url: string} shapes
  const unwrap = (val) => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.url) return val.url;
    return null;
  };

  // 1. OpenRouter chat/completions with modalities: ["image"]
  const images = data.choices?.[0]?.message?.images;
  if (Array.isArray(images) && images.length > 0) {
    const url = unwrap(images[0]?.image_url) || unwrap(images[0]?.url) || unwrap(images[0]);
    if (url) {
      const usage = data.usage || {};
      return { imageUrl: url, tokenUsage: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) };
    }
  }

  // 2. OpenRouter: image URL embedded in message content (some models return markdown)
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    // Check for markdown image: ![...](url)
    const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (mdMatch) return { imageUrl: mdMatch[1], tokenUsage: 0 };
    // Check for raw URL
    const urlMatch = content.match(/(https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp|gif))/i);
    if (urlMatch) return { imageUrl: urlMatch[1], tokenUsage: 0 };
    // Check for base64 data URL in content
    const b64Match = content.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/);
    if (b64Match) return { imageUrl: b64Match[1], tokenUsage: 0 };
  }

  // 3. OpenAI /images/generations format: data[0].b64_json or data[0].url
  const imageData = data.data?.[0];
  if (imageData?.b64_json) {
    return { imageUrl: `data:image/png;base64,${imageData.b64_json}`, tokenUsage: 0 };
  }
  if (imageData?.url) {
    return { imageUrl: imageData.url, tokenUsage: 0 };
  }

  // 4. Top-level fields (some APIs return directly)
  for (const key of ["imageUrl", "image_url", "image", "url", "output"]) {
    const val = unwrap(data[key]);
    if (val) return { imageUrl: val, tokenUsage: 0 };
  }

  // 5. Array at top level: [{url}, ...]
  if (Array.isArray(data) && data.length > 0) {
    const val = unwrap(data[0]?.url) || unwrap(data[0]?.image_url) || unwrap(data[0]);
    if (val) return { imageUrl: val, tokenUsage: 0 };
  }

  throw new Error(`${providerName} returned no image data in response`);
}

export async function generateImageWithProvider(provider, options) {
  const {
    prompt,
    width = 1024,
    height = 576,
  } = options;

  const baseUrl = (provider.baseUrl || "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Provider baseUrl is required.");
  }

  const headers = { "Content-Type": "application/json" };
  const apiKey = resolveProviderApiKey(provider.id, provider.apiKey);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const isOpenRouter = provider.id === "openrouter" || baseUrl.includes("openrouter.ai");

  if (isOpenRouter) {
    headers["HTTP-Referer"] = "https://ai-music-video-generator.local";
    headers["X-Title"] = "AI Music Video Generator";

    let model = provider.selectedModel;
    const endpoint = `${baseUrl}/chat/completions`;

    let response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        modalities: ["image"],
        messages: [{ role: "user", content: prompt }],
        image_config: {
          aspect_ratio: `${width}:${height}`,
          image_size: "1K",
        },
      }),
    });

    if (response.status === 404 && model && !model.includes(":")) {
      model = `${model}:free`;
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          modalities: ["image"],
          messages: [{ role: "user", content: prompt }],
          image_config: {
            aspect_ratio: `${width}:${height}`,
            image_size: "1K",
          },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const error = new Error(`OpenRouter image API error ${response.status}: ${errorText}`);
      error.statusCode = response.status;
      error.providerId = provider.id;
      error.providerName = provider.name;
      error.upstreamBody = errorText;
      throw error;
    }

    const data = await response.json();
    return { ...extractImageFromResponse(data, provider.name), usage: data.usage };
  }

  // Generic OpenAI-compatible image endpoint (/images/generations)
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.selectedModel,
      prompt,
      n: 1,
      size: `${width}x${height}`,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const error = new Error(`${provider.name} image API error ${response.status}: ${errorText}`);
    error.statusCode = response.status;
    error.providerId = provider.id;
    error.providerName = provider.name;
    error.upstreamBody = errorText;
    throw error;
  }

  const data = await response.json();
  return extractImageFromResponse(data, provider.name);
}

// --- Image Editing: Gemini ---

export async function editImageWithGemini({ imageDataUrl, prompt }) {
  const ai = getGeminiClient();

  if (!imageDataUrl?.startsWith("data:")) {
    throw new Error("Gemini image editing requires a data URL input.");
  }

  const [header, base64Data] = imageDataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const partWithData = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData
  );

  if (!partWithData?.inlineData?.data) {
    throw new Error("Gemini did not return an edited image.");
  }

  return {
    imageUrl: `data:${partWithData.inlineData.mimeType};base64,${partWithData.inlineData.data}`,
    tokenUsage: 750,
  };
}
