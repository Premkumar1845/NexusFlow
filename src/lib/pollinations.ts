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

/* ── Video generation via Replicate API ───────────────────────────── */

const REPLICATE_API = "https://api.replicate.com/v1";

export function hasReplicateKey() {
    return Boolean(process.env.REPLICATE_API_TOKEN);
}

/**
 * Generates a short video clip via Replicate (anotherjesse/zeroscope-v2-xl).
 * Polls until the prediction succeeds, then fetches the MP4 bytes and
 * returns them as a base64 data URL.
 * Requires REPLICATE_API_TOKEN in the environment (free at replicate.com).
 */
export async function generateReplicateVideo(prompt: string): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN is not set.");

    // 1. Create prediction
    const createRes = await fetch(
        `${REPLICATE_API}/models/anotherjesse/zeroscope-v2-xl/predictions`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: { prompt, num_frames: 24, fps: 8, width: 576, height: 320 },
            }),
        }
    );

    if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Replicate error ${createRes.status}`);
    }

    const prediction = await createRes.json() as { id: string; status: string; error?: string };

    // 2. Poll until done (up to 110 s)
    const deadline = Date.now() + 110_000;
    let pollUrl = `${REPLICATE_API}/predictions/${prediction.id}`;

    while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));

        const pollRes = await fetch(pollUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!pollRes.ok) throw new Error(`Poll error ${pollRes.status}`);

        const state = await pollRes.json() as {
            status: string;
            output?: string[];
            error?: string;
        };

        if (state.status === "failed" || state.error) {
            throw new Error(state.error ?? "Replicate prediction failed.");
        }

        if (state.status === "succeeded" && state.output?.length) {
            const videoUrl = state.output[0];

            // 3. Fetch video bytes and return as base64 data URL
            const vidRes = await fetch(videoUrl);
            if (!vidRes.ok) throw new Error("Failed to download generated video.");

            const buf = Buffer.from(await vidRes.arrayBuffer());
            return `data:video/mp4;base64,${buf.toString("base64")}`;
        }
    }

    throw new Error("Video generation timed out. Please try again.");
}
