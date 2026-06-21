"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { CATEGORIES, detectCategory, type CategoryId } from "@/lib/categories";
import { NexusMark } from "@/components/brand/Logo";

export default function DiscoverView({
    initialQuery = "",
    onPick,
}: {
    initialQuery?: string;
    onPick: (id: CategoryId, query?: string) => void;
}) {
    const [query, setQuery] = useState(initialQuery);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        const cat = detectCategory(q) ?? "code";
        onPick(cat, q);
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Center logo + tagline */}
            <div className="flex flex-col items-center text-center pt-2 pb-6">
                <span
                    className="grid place-items-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
                    style={{
                        background:
                            "linear-gradient(135deg, #1a56db 0%, #2f6df0 55%, #1748b8 100%)",
                    }}
                >
                    <NexusMark className="w-8 h-8 text-white" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                    Access next-gen AI tools under 1 platform
                </h1>
                <p className="mt-2 text-sm text-white/50 max-w-md">
                    Search to launch a tool, or pick a category below. Everything runs
                    here — no redirects.
                </p>

                {/* Central search engine bar */}
                <form onSubmit={submit} className="mt-5 w-full max-w-xl">
                    <div className="flex items-center gap-3 rounded-full bg-[#242427] ring-1 ring-white/10 pl-5 pr-1.5 py-1.5 focus-within:ring-[#1A56DB] transition-shadow">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search AI tools — image, video, code, docs, agentic, builders…"
                            className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none py-2"
                            aria-label="Search AI tools"
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="grid place-items-center w-9 h-9 rounded-full bg-[#1A56DB] text-white hover:scale-105 active:scale-95 transition-transform"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 rounded-xl bg-white/[0.03] ring-1 ring-white/5 mb-6">
                <Stat label="TOOLS LIVE" value="120+" sub="Across all categories" />
                <Stat label="CATEGORIES" value="6" sub="Image · Video · Code · Docs…" />
                <Stat label="AI MODELS" value="30+" sub="Via OpenRouter API" />
                <Stat label="TASKS DONE" value="1.2M" sub="Platform-wide sessions" />
            </div>

            {/* Category cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onPick(cat.id)}
                            className="group text-left rounded-xl bg-white/[0.03] ring-1 ring-white/5 hover:ring-[#1A56DB]/50 hover:bg-white/[0.05] p-4 transition-all"
                        >
                            <span className="grid place-items-center w-10 h-10 rounded-lg bg-[#1A56DB]/15 ring-1 ring-[#1A56DB]/30 mb-3 group-hover:scale-105 transition-transform">
                                <Icon className="w-5 h-5 text-[#5b8def]" />
                            </span>
                            <div className="text-sm font-medium text-white">{cat.name}</div>
                            <div className="text-xs text-white/45 mt-0.5">{cat.tagline}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {cat.models.slice(0, 2).map((m) => (
                                    <span
                                        key={m.id}
                                        className="text-[10px] text-white/50 bg-white/5 rounded-full px-2 py-0.5"
                                    >
                                        {m.label}
                                    </span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="px-4 py-3.5">
            <div className="text-[9px] tracking-wider text-white/35">{label}</div>
            <div className="text-xl font-medium text-white mt-0.5">{value}</div>
            <div className="text-[9px] text-white/30 mt-0.5 truncate">{sub}</div>
        </div>
    );
}
