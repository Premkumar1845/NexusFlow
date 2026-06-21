"use client";

import { Fragment } from "react";

/**
 * Minimal, dependency-free markdown renderer for AI output.
 * Supports headings, bold, inline code, fenced code blocks, and lists.
 * Output is escaped — no raw HTML is injected.
 */
export default function Markdown({ text }: { text: string }) {
    const blocks = parseBlocks(text);
    return (
        <div className="space-y-3 text-sm leading-relaxed text-white/85">
            {blocks.map((b, i) => {
                if (b.type === "code") {
                    return (
                        <pre
                            key={i}
                            className="nf-scroll overflow-x-auto rounded-lg bg-[#1a1a1c] ring-1 ring-white/10 p-3 text-[12.5px] text-white/90"
                        >
                            <code>{b.content}</code>
                        </pre>
                    );
                }
                if (b.type === "heading") {
                    return (
                        <h3 key={i} className="text-base font-semibold text-white">
                            {inline(b.content)}
                        </h3>
                    );
                }
                if (b.type === "list") {
                    return (
                        <ul key={i} className="list-disc pl-5 space-y-1">
                            {b.items.map((it, j) => (
                                <li key={j}>{inline(it)}</li>
                            ))}
                        </ul>
                    );
                }
                return (
                    <p key={i} className="whitespace-pre-wrap">
                        {inline(b.content)}
                    </p>
                );
            })}
        </div>
    );
}

type Block =
    | { type: "paragraph"; content: string }
    | { type: "heading"; content: string }
    | { type: "code"; content: string }
    | { type: "list"; items: string[] };

function parseBlocks(text: string): Block[] {
    const lines = text.split("\n");
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (line.trimStart().startsWith("```")) {
            const buf: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
                buf.push(lines[i]);
                i++;
            }
            i++; // skip closing fence
            blocks.push({ type: "code", content: buf.join("\n") });
            continue;
        }

        if (/^#{1,6}\s/.test(line)) {
            blocks.push({ type: "heading", content: line.replace(/^#{1,6}\s/, "") });
            i++;
            continue;
        }

        if (/^\s*[-*]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
                i++;
            }
            blocks.push({ type: "list", items });
            continue;
        }

        if (line.trim() === "") {
            i++;
            continue;
        }

        // gather a paragraph until blank line
        const buf: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].trimStart().startsWith("```") &&
            !/^#{1,6}\s/.test(lines[i]) &&
            !/^\s*[-*]\s+/.test(lines[i])
        ) {
            buf.push(lines[i]);
            i++;
        }
        blocks.push({ type: "paragraph", content: buf.join("\n") });
    }

    return blocks;
}

/** Inline formatting: **bold** and `code`. */
function inline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-white">
                    {p.slice(2, -2)}
                </strong>
            );
        }
        if (p.startsWith("`") && p.endsWith("`")) {
            return (
                <code
                    key={i}
                    className="rounded bg-white/10 px-1 py-0.5 text-[12.5px] text-white/90"
                >
                    {p.slice(1, -1)}
                </code>
            );
        }
        return <Fragment key={i}>{p}</Fragment>;
    });
}
