import { NextRequest, NextResponse } from "next/server";
import { generatePollinationsVideo } from "@/lib/pollinations";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/video — video generation endpoint.
 *
 * Uses Pollinations' free video API to generate a short MP4 clip from a
 * text prompt. Returns { video: <mp4-url> } on success.
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

    const url = await generatePollinationsVideo(prompt);
    if (url) {
        return NextResponse.json({ video: url });
    }

    return NextResponse.json(
        { error: "Video generation failed. Please try again shortly." },
        { status: 503 }
    );
}
