/**
 * Thin server-side wrapper around the OpenRouter Chat Completions API.
 * Keeps the API key on the server — the browser never sees it, and no
 * request ever leaves NexusFlow's own API routes (no external redirects).
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type ChatOptions = {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    signal?: AbortSignal;
};

function headers() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
        throw new Error(
            "OPENROUTER_API_KEY is not set. Add it to .env.local to enable AI features."
        );
    }
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": site,
        "X-Title": "NexusFlow",
    };
}

export function hasOpenRouterKey() {
    return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Non-streaming completion — returns the full assistant message text. */
export async function chatComplete(opts: ChatOptions): Promise<string> {
    const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
            model: opts.model,
            messages: opts.messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 1500,
        }),
        signal: opts.signal,
    });

    if (!res.ok) {
        const detail = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
}

/** Streaming completion — returns the raw SSE ReadableStream from OpenRouter. */
export async function chatStream(opts: ChatOptions): Promise<Response> {
    return fetch(OPENROUTER_URL, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
            model: opts.model,
            messages: opts.messages,
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 2000,
            stream: true,
        }),
        signal: opts.signal,
    });
}

/** Image-capable OpenRouter models, tried in order. */
export const IMAGE_MODELS = [
    "google/gemini-2.5-flash-image-preview",
    "google/gemini-2.0-flash-exp:free",
];

/**
 * Real image generation via OpenRouter's multimodal chat endpoint.
 * Returns a data/HTTP image URL, or null if no model produced an image.
 */
export async function generateImage(
    prompt: string,
    preferredModel?: string
): Promise<string | null> {
    const candidates = [
        ...(preferredModel ? [preferredModel] : []),
        ...IMAGE_MODELS,
    ];
    const tried = new Set<string>();

    for (const model of candidates) {
        if (tried.has(model)) continue;
        tried.add(model);
        try {
            const res = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({
                    model,
                    modalities: ["image", "text"],
                    messages: [{ role: "user", content: prompt }],
                }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            const message = data?.choices?.[0]?.message;
            const url =
                message?.images?.[0]?.image_url?.url ??
                message?.images?.[0]?.url ??
                null;
            if (typeof url === "string" && url.length > 0) return url;
        } catch {
            // try the next candidate
        }
    }
    return null;
}
