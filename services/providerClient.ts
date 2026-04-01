/**
 * Provider-agnostic LLM client that routes through OpenAI-compatible APIs.
 * Supports OpenRouter, NVIDIA NIM, Ollama, and any OpenAI-compatible endpoint.
 * Falls back to Gemini only when no thinking provider is configured.
 */
import type { AIProvider, AIProviderSettings } from '../types';
// Type enum import removed — we use raw string mapping instead

// --- Gemini Type → JSON Schema conversion ---

/** Convert a Gemini-style schema (using Type enum) to standard JSON Schema */
export function geminiSchemaToJsonSchema(schema: any): any {
    if (!schema) return {};

    const typeMap: Record<string, string> = {
        'STRING': 'string',
        'INTEGER': 'integer',
        'NUMBER': 'number',
        'OBJECT': 'object',
        'ARRAY': 'array',
        'BOOLEAN': 'boolean',
        'NULL': 'null',
    };

    const result: any = {};

    if (schema.type) {
        result.type = typeMap[schema.type] || schema.type;
    }
    if (schema.description) {
        result.description = schema.description;
    }
    if (schema.enum) {
        result.enum = schema.enum;
    }
    if (schema.properties) {
        result.properties = {};
        for (const [key, value] of Object.entries(schema.properties)) {
            result.properties[key] = geminiSchemaToJsonSchema(value);
        }
    }
    if (schema.required) {
        result.required = schema.required;
    }
    if (schema.items) {
        result.items = geminiSchemaToJsonSchema(schema.items);
    }

    // Ensure objects have additionalProperties: false for strict mode compatibility
    if (result.type === 'object' && result.properties) {
        result.additionalProperties = false;
        // In strict mode, all properties must be in required
        if (!result.required) {
            result.required = Object.keys(result.properties);
        }
    }

    return result;
}

// --- OpenAI-compatible API client ---

interface GenerateOptions {
    /** The prompt text */
    prompt: string;
    /** Optional system message */
    system?: string;
    /** Gemini-style response schema (will be auto-converted to JSON Schema) */
    responseSchema?: any;
    /** Whether to request JSON output */
    jsonMode?: boolean;
    /** Optional multimodal content (images as base64 data URLs) */
    images?: { data: string; mimeType: string }[];
    /** Temperature (0-2) */
    temperature?: number;
    /** Max output tokens */
    maxTokens?: number;
}

interface GenerateResult {
    text: string;
    tokenUsage: number;
}

/**
 * Check if a thinking provider is properly configured
 */
export function hasThinkingProvider(settings?: AIProviderSettings): boolean {
    if (!settings?.thinking) return false;
    const t = settings.thinking;
    return !!(t.enabled && t.baseUrl && t.selectedModel);
}

/**
 * Generate text using the configured thinking provider (OpenAI-compatible API).
 * Throws if the provider is not configured or the request fails.
 */
export async function generateWithProvider(
    provider: AIProvider,
    options: GenerateOptions
): Promise<GenerateResult> {
    const { prompt, system, responseSchema, jsonMode, images, temperature, maxTokens } = options;

    // Build messages array
    const messages: any[] = [];

    if (system) {
        messages.push({ role: 'system', content: system });
    }

    // Build user message content
    if (images && images.length > 0) {
        // Multimodal: text + images
        const content: any[] = images.map(img => ({
            type: 'image_url',
            image_url: {
                url: img.data.startsWith('data:') ? img.data : `data:${img.mimeType};base64,${img.data}`,
            }
        }));
        content.push({ type: 'text', text: prompt });
        messages.push({ role: 'user', content });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    // Build request body
    const body: any = {
        model: provider.selectedModel,
        messages,
        temperature: temperature ?? 0.7,
    };

    if (maxTokens) {
        body.max_tokens = maxTokens;
    }

    // Handle structured output
    if (responseSchema) {
        const jsonSchema = geminiSchemaToJsonSchema(responseSchema);
        body.response_format = {
            type: 'json_schema',
            json_schema: {
                name: 'response',
                strict: false,
                schema: jsonSchema,
            }
        };
    } else if (jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    // Determine endpoint
    const baseUrl = provider.baseUrl.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/chat/completions`;

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    console.log(`[ProviderClient] Calling ${provider.name} model: ${body.model} (hasApiKey: ${!!provider.apiKey}, keyPrefix: ${provider.apiKey?.substring(0, 8) || 'NONE'})`);

    let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    // OpenRouter: if model not found, retry with :free suffix (common mismatch from model list)
    if (response.status === 404 && !body.model.includes(':') && provider.baseUrl.includes('openrouter')) {
        console.log(`[ProviderClient] Model not found, retrying with :free suffix`);
        body.model = body.model + ':free';
        response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`${provider.name} API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
        throw new Error(`${provider.name} returned empty response`);
    }

    const text = choice.message.content;
    const usage = data.usage;
    const tokenUsage = (usage?.prompt_tokens || 0) + (usage?.completion_tokens || 0);

    return { text, tokenUsage };
}

/**
 * Convenience: generate with the thinking provider from settings.
 * Falls back to null if not configured (caller should use Gemini fallback).
 */
export async function generateThinking(
    settings: AIProviderSettings | undefined,
    options: GenerateOptions
): Promise<GenerateResult | null> {
    if (!hasThinkingProvider(settings)) return null;
    return generateWithProvider(settings!.thinking, options);
}
