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

/* ── Video generation ──────────────────────────────────────────────── */

const POLLINATIONS_VIDEO_BASE = "https://video.pollinations.ai/prompt";

/**
 * Generates a short video clip for `prompt` using Pollinations' free video
 * API and returns the public MP4 URL, or null if the request fails.
 */
export async function generatePollinationsVideo(
    prompt: string
): Promise<string | null> {
    const url = `${POLLINATIONS_VIDEO_BASE}/${encodeURIComponent(prompt)}`;
    try {
        // HEAD first to verify the URL resolves before handing it to the client.
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) return null;
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.startsWith("video/") && !ct.startsWith("application/octet")) return null;
        return url;
    } catch {
        return null;
    }
}
