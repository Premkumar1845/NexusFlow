import { NextRequest, NextResponse } from "next/server";
import { chatStream, hasOpenRouterKey, type ChatMessage } from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat — proxies a streaming chat completion through OpenRouter.
 * Body: { model: string, messages: ChatMessage[], temperature?, maxTokens? }
 * The OpenRouter SSE stream is piped straight back to the browser so the
 * interaction never leaves NexusFlow.
 */
export async function POST(req: NextRequest) {
    if (!hasOpenRouterKey()) {
        return NextResponse.json(
            { error: "AI is not configured. Add OPENROUTER_API_KEY to .env.local." },
            { status: 503 }
        );
    }

    let body: {
        model?: string;
        messages?: ChatMessage[];
        temperature?: number;
        maxTokens?: number;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body.model || !Array.isArray(body.messages) || body.messages.length === 0) {
        return NextResponse.json(
            { error: "`model` and a non-empty `messages` array are required." },
            { status: 400 }
        );
    }

    try {
        const upstream = await chatStream({
            model: body.model,
            messages: body.messages,
            temperature: body.temperature,
            maxTokens: Math.min(body.maxTokens ?? 2000, 3000),
        });

        if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text();
            return NextResponse.json(
                { error: `Model error: ${detail.slice(0, 300)}` },
                { status: upstream.status }
            );
        }

        return new Response(upstream.body, {
            headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
