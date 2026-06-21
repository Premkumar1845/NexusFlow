import { NextRequest, NextResponse } from "next/server";
import { generateImage, hasOpenRouterKey } from "@/lib/openrouter";
import { generatePollinationsImage, hasPollinationsKey } from "@/lib/pollinations";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/image — image generation endpoint.
 *
 * Generation order: Pollinations AI (dedicated image key) → OpenRouter
 * image-capable model → deterministic neutral placeholder. The end-to-end
 * "prompt → image inline" flow always works, all in-app.
 */
export async function POST(req: NextRequest) {
    let body: { prompt?: string; model?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const prompt = (body.prompt ?? "").trim();
    if (!prompt) {
        return NextResponse.json({ error: "`prompt` is required." }, { status: 400 });
    }

    // 1) Pollinations AI — dedicated image generation.
    if (hasPollinationsKey()) {
        try {
            const url = await generatePollinationsImage(prompt);
            if (url) {
                return NextResponse.json({ image: url, placeholder: false });
            }
        } catch {
            // fall through
        }
    }

    // 2) OpenRouter image-capable model.
    if (hasOpenRouterKey()) {
        try {
            const url = await generateImage(prompt, body.model);
            if (url) {
                return NextResponse.json({ image: url, placeholder: false });
            }
        } catch {
            // fall through to placeholder
        }
    }

    // 3) Deterministic neutral placeholder derived from the prompt.
    const image = renderPlaceholder(prompt);
    return NextResponse.json({
        image,
        placeholder: true,
        note:
            "Showing a placeholder — image generation is unavailable right now. Try again shortly.",
    });
}

function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
}

/** Build a neutral, grayscale-leaning SVG data URL keyed off the prompt. */
function renderPlaceholder(prompt: string): string {
    const h = hashString(prompt);
    const a = 200 + (h % 40);
    const b = 150 + ((h >> 4) % 50);
    const angle = h % 360;
    const label = prompt.length > 60 ? prompt.slice(0, 57) + "…" : prompt;
    const esc = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0" stop-color="rgb(${a},${a},${a})"/>
      <stop offset="1" stop-color="rgb(${b},${b},${b})"/>
    </linearGradient>
  </defs>
  <rect width="768" height="768" fill="url(#g)"/>
  <circle cx="${h % 768}" cy="${(h >> 3) % 768}" r="180" fill="rgba(255,255,255,0.10)"/>
  <circle cx="${(h >> 5) % 768}" cy="${(h >> 7) % 768}" r="120" fill="rgba(0,0,0,0.08)"/>
  <rect x="40" y="660" width="688" height="68" rx="14" fill="rgba(0,0,0,0.45)"/>
  <text x="64" y="702" fill="#fff" font-family="system-ui,sans-serif" font-size="22">${esc}</text>
</svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
