import { NextRequest, NextResponse } from "next/server";
import { generateReplicateVideo, hasReplicateKey } from "@/lib/pollinations";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/video — video generation via Replicate (zeroscope-v2-xl).
 * Requires REPLICATE_API_TOKEN in .env.local (free at replicate.com).
 */
export async function POST(req: NextRequest) {
    let body: { prompt?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const prompt = (body.prompt ?? "").trim();
    if (!prompt) {
        return NextResponse.json({ error: "`prompt` is required." }, { status: 400 });
    }

    if (!hasReplicateKey()) {
        return NextResponse.json(
            {
                error:
                    "Video generation requires a free Replicate API token. " +
                    "Add REPLICATE_API_TOKEN=r8_xxx to your .env.local. " +
                    "Get a free token at https://replicate.com/account/api-tokens",
            },
            { status: 503 }
        );
    }

    try {
        const dataUrl = await generateReplicateVideo(prompt);
        return NextResponse.json({ video: dataUrl });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Video generation failed.";
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
