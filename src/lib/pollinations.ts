/**
 * Server-side Pollinations AI image generation.
 * The API key stays on the server — we fetch the image bytes and return a
 * base64 data URL so the browser never sees the token.
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export function hasPollinationsKey() {
    return Boolean(process.env.POLLINATIONS_API_KEY);
}

export type PollinationsOptions = {
    width?: number;
    height?: number;
    model?: string;
    seed?: number;
};

/**
 * Generates an image for `prompt` and returns it as a base64 data URL,
 * or null if the request fails.
 */
export async function generatePollinationsImage(
    prompt: string,
    opts: PollinationsOptions = {}
): Promise<string | null> {
    const key = process.env.POLLINATIONS_API_KEY;
    if (!key) return null;

    const { width = 1024, height = 1024, model = "flux", seed } = opts;
    const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        model,
        nologo: "true",
    });
    if (seed !== undefined) params.set("seed", String(seed));

    const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;

    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return null;

        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        if (!contentType.startsWith("image/")) return null;

        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength === 0) return null;

        return `data:${contentType};base64,${buf.toString("base64")}`;
    } catch {
        return null;
    }
}

/* ── Video generation via Hugging Face Inference API ──────────────── */

const HF_VIDEO_MODEL =
    "https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b";

export function hasHuggingFaceKey() {
    return Boolean(process.env.HUGGINGFACE_API_KEY);
}

/**
 * Generates a short video clip for `prompt` using the free Hugging Face
 * Inference API and returns a base64 data URL on success, or throws an
 * Error with a human-readable message on failure.
 * Requires HUGGINGFACE_API_KEY in the environment.
 */
export async function generateHuggingFaceVideo(
    prompt: string
): Promise<string> {
    const key = process.env.HUGGINGFACE_API_KEY;
    if (!key) throw new Error("HUGGINGFACE_API_KEY is not set.");

    const res = await fetch(HF_VIDEO_MODEL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "x-wait-for-model": "true",
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: AbortSignal.timeout(120_000),
    });

    const ct = res.headers.get("content-type") ?? "";

    // HuggingFace returns JSON on errors (model loading, quota, etc.)
    if (ct.includes("application/json") || !res.ok) {
        let json: { error?: string; estimated_time?: number } = {};
        try { json = await res.json(); } catch { /* ignore */ }
        if (json.estimated_time) {
            throw new Error(
                `Model is warming up — estimated wait: ${Math.ceil(json.estimated_time)}s. Please try again shortly.`
            );
        }
        throw new Error(json.error ?? `HuggingFace returned status ${res.status}.`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) throw new Error("Received empty video response.");

    return `data:video/mp4;base64,${buf.toString("base64")}`;
}
