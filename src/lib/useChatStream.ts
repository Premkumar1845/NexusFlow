"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/openrouter";

type RunArgs = {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
};

/**
 * Streams a chat completion from /api/chat (OpenRouter proxy) and exposes the
 * incrementally-built text. Everything stays in-app — no external redirects.
 */
export function useChatStream() {
    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const stop = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setLoading(false);
    }, []);

    const run = useCallback(async (args: RunArgs): Promise<string> => {
        setError(null);
        setOutput("");
        setLoading(true);

        const controller = new AbortController();
        controllerRef.current = controller;

        let full = "";
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(args),
                signal: controller.signal,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Request failed (${res.status}).`);
            }
            if (!res.body) throw new Error("No response stream.");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === "[DONE]") continue;
                    try {
                        const json = JSON.parse(payload);
                        const delta = json.choices?.[0]?.delta?.content ?? "";
                        if (delta) {
                            full += delta;
                            setOutput(full);
                        }
                    } catch {
                        // partial JSON chunk — ignore, it will complete next read
                    }
                }
            }
        } catch (err) {
            if ((err as Error).name !== "AbortError") {
                setError(err instanceof Error ? err.message : "Stream failed.");
            }
        } finally {
            setLoading(false);
            controllerRef.current = null;
        }
        return full;
    }, []);

    return { output, setOutput, loading, error, run, stop };
}
