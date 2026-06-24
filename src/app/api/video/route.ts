import { NextRequest, NextResponse } from "next/server";
import { generateHuggingFaceVideo, hasHuggingFaceKey } from "@/lib/pollinations";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/video — video generation endpoint.
 *
 * Uses the free Hugging Face Inference API (damo-vilab/text-to-video-ms-1.7b)
 * to generate a short MP4 clip from a text prompt.
 * Requires HUGGINGFACE_API_KEY in .env.local (free token from huggingface.co).
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

    if (!hasHuggingFaceKey()) {
        return NextResponse.json(
            {
                error:
                    "Video generation requires a free Hugging Face API key. " +
                    "Add HUGGINGFACE_API_KEY to your .env.local file. " +
                    "Get a free token at https://huggingface.co/settings/tokens",
            },
            { status: 503 }
        );
    }

    try {
        const dataUrl = await generateHuggingFaceVideo(prompt);
        return NextResponse.json({ video: dataUrl });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Video generation failed.";
        return NextResponse.json({ error: message }, { status: 503 });
    }
}
