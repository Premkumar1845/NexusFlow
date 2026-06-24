"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Download,
    Copy,
    Check,
    Code2,
    Eye,
    Play,
    ImageIcon,
    Loader2,
} from "lucide-react";
import type { Category } from "@/lib/categories";
import { useChatStream } from "@/lib/useChatStream";
import { saveSession, type NexusSession } from "@/lib/sessions";
import ToolFrame from "./ToolFrame";
import Markdown from "./Markdown";

const SYSTEM_PROMPTS: Record<string, string> = {
    code: "You are an expert programmer. Return clean, correct, well-commented code. Use fenced code blocks with a language tag. Keep prose brief.",
    docs: "You are a professional writing assistant. Produce clear, well-structured documents using markdown headings, bold and lists.",
    agentic:
        "You are an autonomous task planner. Break the user's goal into a numbered, step-by-step pipeline. For each step give a bold title and a one-line description of the action and expected output.",
    builder:
        "You are a senior front-end engineer. Return a SINGLE complete, self-contained HTML file (inline CSS and JS, no external build step) that fulfils the request. Wrap it in a ```html code block. No explanation outside the code block.",
};

type Props = {
    category: Category;
    initialPrompt?: string;
    resume?: NexusSession | null;
    onSession?: (s: NexusSession) => void;
};

export default function ToolWorkspace({
    category,
    initialPrompt = "",
    resume,
    onSession,
}: Props) {
    const [model, setModel] = useState(category.models[0].id);
    const [prompt, setPrompt] = useState(initialPrompt);
    const { output, setOutput, loading, error, run, stop } = useChatStream();

    // image/video state
    const [media, setMedia] = useState<string | null>(null);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const sessionIdRef = useRef<string | undefined>(undefined);

    // Reset when switching category or resuming a past session.
    useEffect(() => {
        setModel(category.models[0].id);
        if (resume && resume.tool_category === category.id) {
            setPrompt(resume.prompt);
            sessionIdRef.current = resume.id;
            if (category.interface === "image" || category.interface === "video") {
                setMedia(resume.output || null);
            } else {
                setOutput(resume.output);
            }
        } else {
            setPrompt(initialPrompt);
            sessionIdRef.current = undefined;
            setMedia(null);
            setOutput("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category.id, resume?.id]);

    const isMedia = category.interface === "image" || category.interface === "video";

    async function persist(out: string, status: NexusSession["status"]) {
        try {
            const saved = await saveSession({
                id: sessionIdRef.current,
                tool_category: category.id,
                model,
                prompt,
                output: out,
                status,
            });
            sessionIdRef.current = saved.id;
            onSession?.(saved);
        } catch {
            // non-fatal — persistence is best-effort
        }
    }

    async function handleRunText() {
        const system = SYSTEM_PROMPTS[category.interface];
        await persist("", "running");
        const full = await run({
            model,
            messages: [
                ...(system ? [{ role: "system" as const, content: system }] : []),
                { role: "user" as const, content: prompt },
            ],
            maxTokens: category.interface === "builder" ? 2800 : 1800,
        });
        if (full) await persist(full, "done");
    }

    async function handleRunMedia() {
        setMediaError(null);
        setMediaLoading(true);
        setMedia(null);
        await persist("", "running");
        try {
            const isVideo = category.interface === "video";
            const endpoint = isVideo ? "/api/video" : "/api/image";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, model }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Generation failed.");
            const result = isVideo ? data.video : data.image;
            setMedia(result);
            await persist(result, "done");
        } catch (err) {
            setMediaError(err instanceof Error ? err.message : "Generation failed.");
        } finally {
            setMediaLoading(false);
        }
    }

    return (
        <ToolFrame
            category={category}
            model={model}
            onModelChange={setModel}
            prompt={prompt}
            onPromptChange={setPrompt}
            onRun={isMedia ? handleRunMedia : handleRunText}
            onStop={isMedia ? undefined : stop}
            loading={isMedia ? mediaLoading : loading}
            error={isMedia ? mediaError : error}
            runLabel={
                category.interface === "video"
                    ? "Render video"
                    : category.interface === "image"
                        ? "Generate image"
                        : category.interface === "builder"
                            ? "Build it"
                            : "Generate"
            }
        >
            {category.interface === "image" || category.interface === "video" ? (
                <MediaOutput
                    interface={category.interface}
                    media={media}
                    loading={mediaLoading}
                />
            ) : category.interface === "code" ? (
                <CodeOutput output={output} loading={loading} prompt={prompt} />
            ) : category.interface === "builder" ? (
                <BuilderOutput output={output} loading={loading} />
            ) : (
                <DocsOutput
                    output={output}
                    loading={loading}
                    isDoc={category.interface === "docs"}
                />
            )}
        </ToolFrame>
    );
}

/* ── Empty / loading shell ──────────────────────────────────────────── */
function Shell({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-xl bg-[#1a1a1c] ring-1 ring-white/10 p-4 ${className}`}
        >
            {children}
        </div>
    );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <Shell className="grid place-items-center min-h-[240px] text-center">
            <div className="text-white/40">
                <div className="mx-auto mb-2 grid place-items-center w-10 h-10 rounded-full bg-white/5">
                    {icon}
                </div>
                <p className="text-xs max-w-[18rem]">{text}</p>
            </div>
        </Shell>
    );
}

/* ── Image / Video ──────────────────────────────────────────────────── */
function MediaOutput({
    interface: kind,
    media,
    loading,
}: {
    interface: "image" | "video";
    media: string | null;
    loading: boolean;
}) {
    if (loading) {
        return (
            <Shell>
                <div className="nf-shimmer aspect-square w-full max-w-md mx-auto rounded-lg" />
                <p className="mt-3 text-center text-xs text-white/40">
                    {kind === "video" ? "Rendering frames…" : "Generating image…"}
                </p>
            </Shell>
        );
    }
    if (!media) {
        return (
            <Empty
                icon={
                    kind === "video" ? (
                        <Play className="w-5 h-5" />
                    ) : (
                        <ImageIcon className="w-5 h-5" />
                    )
                }
                text={`Your generated ${kind} will appear here, inline — no redirects.`}
            />
        );
    }
    return (
        <Shell>
            <div className="relative mx-auto w-full max-w-md">
                {kind === "video" ? (
                    <video
                        src={media}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full rounded-lg ring-1 ring-white/10"
                    />
                ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={media}
                        alt="Generated output"
                        className="w-full rounded-lg ring-1 ring-white/10"
                    />
                )}
            </div>
            <div className="mt-3 flex justify-center">
                <a
                    href={media}
                    download={`nexusflow-${kind}.${mediaExt(media, kind)}`}
                    className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5"
                >
                    <Download className="w-3.5 h-3.5" /> Download
                </a>
            </div>
        </Shell>
    );
}

/** Infers a file extension from a data/HTTP image URL. */
function mediaExt(url: string, kind?: "image" | "video"): string {
    if (kind === "video") return "mp4";
    const m = /^data:image\/([a-z0-9.+-]+)/i.exec(url);
    if (m) {
        const t = m[1].toLowerCase();
        if (t.includes("jpeg")) return "jpg";
        if (t.includes("svg")) return "svg";
        return t;
    }
    if (/\.png(\?|$)/i.test(url)) return "png";
    if (/\.jpe?g(\?|$)/i.test(url)) return "jpg";
    if (/\.webp(\?|$)/i.test(url)) return "webp";
    return "png";
}

/* ── Code ────────────────────────────────────────────────────────────── */
function CodeOutput({
    output,
    loading,
    prompt,
}: {
    output: string;
    loading: boolean;
    prompt: string;
}) {
    const [copied, setCopied] = useState(false);
    if (!output && !loading) {
        return (
            <Empty
                icon={<Code2 className="w-5 h-5" />}
                text="Generated code appears here with syntax-friendly formatting and one-click copy."
            />
        );
    }
    return (
        <Shell>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 truncate">{prompt || "Output"}</span>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(output);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    }}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <Markdown text={output} />
            {loading && <Caret />}
        </Shell>
    );
}

/* ── Docs / Agentic ─────────────────────────────────────────────────── */
function DocsOutput({
    output,
    loading,
    isDoc,
}: {
    output: string;
    loading: boolean;
    isDoc: boolean;
}) {
    if (!output && !loading) {
        return (
            <Empty
                icon={<Eye className="w-5 h-5" />}
                text={
                    isDoc
                        ? "Your document renders here. Export to a file when you're done."
                        : "Your agent pipeline renders here, step by step."
                }
            />
        );
    }
    return (
        <Shell>
            {isDoc && output && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => {
                            const blob = new Blob([output], { type: "text/markdown" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "nexusflow-document.md";
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                    >
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            )}
            <Markdown text={output} />
            {loading && <Caret />}
        </Shell>
    );
}

/* ── Builder ─────────────────────────────────────────────────────────── */
function BuilderOutput({
    output,
    loading,
}: {
    output: string;
    loading: boolean;
}) {
    const [tab, setTab] = useState<"preview" | "code">("preview");
    const html = useMemo(() => extractHtml(output), [output]);

    if (!output && !loading) {
        return (
            <Empty
                icon={<LayoutIcon />}
                text="Describe an app or page — you'll get a live preview and downloadable code, all in-app."
            />
        );
    }

    return (
        <Shell className="p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <div className="flex gap-1">
                    <Tab active={tab === "preview"} onClick={() => setTab("preview")}>
                        <Eye className="w-3.5 h-3.5" /> Preview
                    </Tab>
                    <Tab active={tab === "code"} onClick={() => setTab("code")}>
                        <Code2 className="w-3.5 h-3.5" /> Code
                    </Tab>
                </div>
                {html && (
                    <button
                        onClick={() => {
                            const blob = new Blob([html], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "nexusflow-app.html";
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                    >
                        <Download className="w-3.5 h-3.5" /> Download
                    </button>
                )}
            </div>

            {tab === "preview" ? (
                html ? (
                    <iframe
                        title="App preview"
                        srcDoc={html}
                        className="w-full h-[420px] bg-white"
                        sandbox="allow-scripts"
                    />
                ) : (
                    <div className="grid place-items-center h-[420px] text-white/40 text-xs">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Building…
                            </span>
                        ) : (
                            "Waiting for HTML output…"
                        )}
                    </div>
                )
            ) : (
                <div className="p-3 max-h-[420px] overflow-auto nf-scroll">
                    <Markdown text={output} />
                    {loading && <Caret />}
                </div>
            )}
        </Shell>
    );
}

function extractHtml(text: string): string | null {
    const fence = text.match(/```html\s*([\s\S]*?)```/i);
    if (fence) return fence[1].trim();
    const doc = text.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
    if (doc) return doc[0];
    const body = text.match(/<html[\s\S]*<\/html>/i);
    if (body) return body[0];
    return null;
}

function Tab({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
                }`}
        >
            {children}
        </button>
    );
}

function Caret() {
    return (
        <span className="inline-block w-2 h-4 ml-0.5 align-text-bottom bg-white/70 animate-pulse" />
    );
}

function LayoutIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M9 9v11" />
        </svg>
    );
}
