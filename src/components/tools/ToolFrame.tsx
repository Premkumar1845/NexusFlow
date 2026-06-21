"use client";

import { Sparkles, Square, ChevronDown } from "lucide-react";
import type { Category } from "@/lib/categories";

type Props = {
    category: Category;
    model: string;
    onModelChange: (m: string) => void;
    prompt: string;
    onPromptChange: (p: string) => void;
    onRun: () => void;
    onStop?: () => void;
    loading: boolean;
    error?: string | null;
    runLabel?: string;
    children: React.ReactNode;
};

/**
 * Shared chrome for every embedded tool: header, model selector, prompt
 * composer and example chips. The `children` slot renders the tool-specific
 * output. All interaction happens in-app.
 */
export default function ToolFrame({
    category,
    model,
    onModelChange,
    prompt,
    onPromptChange,
    onRun,
    onStop,
    loading,
    error,
    runLabel = "Generate",
    children,
}: Props) {
    const Icon = category.icon;

    return (
        <div className="flex flex-col gap-4">
            {/* Tool header */}
            <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-[#1A56DB]/15 ring-1 ring-[#1A56DB]/30">
                    <Icon className="w-5 h-5 text-[#5b8def]" />
                </span>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{category.name}</div>
                    <div className="text-xs text-white/45 truncate">
                        {category.description}
                    </div>
                </div>

                {/* Model picker */}
                <label className="ml-auto relative shrink-0">
                    <span className="sr-only">Model</span>
                    <select
                        value={model}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="appearance-none bg-[#242427] text-white/80 text-xs rounded-lg ring-1 ring-white/10 pl-3 pr-8 py-2 outline-none hover:ring-white/20 focus:ring-[#1A56DB] cursor-pointer"
                    >
                        {category.models.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#242427]">
                                {m.label} · {m.provider}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </label>
            </div>

            {/* Prompt composer */}
            <div className="rounded-xl bg-[#242427] ring-1 ring-white/10 p-3">
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onRun();
                    }}
                    rows={3}
                    placeholder={`Describe what you want… e.g. "${category.examples[0]}"`}
                    className="nf-scroll w-full bg-transparent text-sm text-white placeholder-white/35 outline-none resize-none"
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                        {category.examples.slice(0, 2).map((ex) => (
                            <button
                                key={ex}
                                onClick={() => onPromptChange(ex)}
                                className="text-[11px] text-white/50 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 truncate max-w-[12rem]"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                    {loading && onStop ? (
                        <button
                            onClick={onStop}
                            className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-white/15 shrink-0"
                        >
                            <Square className="w-3.5 h-3.5" /> Stop
                        </button>
                    ) : (
                        <button
                            onClick={onRun}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center gap-1.5 bg-[#1A56DB] text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-[#1748b8] transition-colors disabled:opacity-50 shrink-0"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {runLabel}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <p className="text-xs text-[#ff5f57] bg-[#ff5f57]/10 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            {/* Output */}
            <div className="min-h-[240px]">{children}</div>
        </div>
    );
}
