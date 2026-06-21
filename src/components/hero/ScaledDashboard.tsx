"use client";

import { useEffect, useRef, useState } from "react";
import {
    PanelLeft,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Share,
    Plus,
    Copy,
    Monitor,
    Compass,
    Layers,
    ListTodo,
    Grid,
    Sparkles,
} from "lucide-react";
import { NexusMark } from "@/components/brand/Logo";

const DESIGN_WIDTH = 896;

/**
 * Hero dashboard preview. Renders the dashboard at a fixed 896px design width
 * and scales it down with a CSS transform (via ResizeObserver) so it fits any
 * viewport without reflow — exactly matching the production dashboard chrome.
 */
export default function ScaledDashboard() {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [outerHeight, setOuterHeight] = useState<number>();

    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;

        const update = () => {
            const w = outer.clientWidth;
            const s = w / DESIGN_WIDTH;
            setScale(s);
            setOuterHeight(inner.offsetHeight * s);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(outer);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={outerRef}
            className="animate-hero-rise [animation-delay:620ms] relative z-0 w-[92%] sm:w-[84%] lg:w-[72%] max-w-4xl mx-auto shrink-0 -mb-10 sm:-mb-20 lg:-mb-32"
            style={{ height: outerHeight }}
        >
            <div
                ref={innerRef}
                style={{
                    width: DESIGN_WIDTH,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
                className="rounded-t-2xl overflow-hidden bg-[#1a1a1c] shadow-[0_-20px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
            >
                {/* Title bar */}
                <div className="bg-[#242427] border-b border-white/5 px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                        <PanelLeft className="w-3.5 h-3.5" />
                        <ChevronLeft className="w-3.5 h-3.5 text-white/25" />
                        <ChevronRight className="w-3.5 h-3.5 text-white/25" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="bg-[#1a1a1c] rounded-md px-6 py-1 text-[10px] text-white/60 flex items-center gap-1.5">
                            <Monitor className="w-3 h-3 text-white/40" />
                            nexusflow.ai
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                        <RotateCw className="w-3.5 h-3.5" />
                        <Share className="w-3.5 h-3.5" />
                        <Plus className="w-3.5 h-3.5" />
                        <Copy className="w-3.5 h-3.5" />
                    </div>
                </div>

                {/* Body: sidebar + content */}
                <div className="flex">
                    {/* Sidebar (22%) */}
                    <aside className="w-[22%] bg-[#1e1e21] border-r border-white/5 px-3 py-3.5">
                        <div className="flex items-center gap-1.5 mb-4">
                            <NexusMark className="w-4 h-4 text-white/70" />
                            <Grid className="w-3.5 h-3.5 text-white/30" />
                        </div>
                        <div className="flex items-center gap-2 mb-5">
                            <span className="grid place-items-center w-4 h-4 rounded bg-[#1A56DB] text-white text-[9px] font-semibold">
                                N
                            </span>
                            <span className="text-[10px] text-white/80">NexusFlow</span>
                        </div>

                        <nav className="space-y-2.5">
                            <SideItem icon={<Compass className="w-3 h-3" />} label="Discover" />
                            <SideItem icon={<Layers className="w-3 h-3" />} label="Categories" />
                            <SideItem icon={<ListTodo className="w-3 h-3" />} label="History" />
                        </nav>

                        <div className="mt-5 space-y-2">
                            <Recent label="Cyberpunk skyline" dot="#28c840" />
                            <Recent label="React debounce hook" dot="#28c840" />
                            <Recent label="Launch checklist" dot="#febc2e" />
                        </div>
                    </aside>

                    {/* Content */}
                    <section className="flex-1 px-5 py-4">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#1A56DB]">
                                <NexusMark className="w-5 h-5 text-white" />
                            </span>
                            <div>
                                <div className="text-sm font-medium text-white">NexusFlow</div>
                                <div className="text-[10px] text-white/45">AI tools under one roof</div>
                            </div>
                            <button className="ml-auto flex items-center gap-1.5 bg-[#1A56DB] text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5" />
                                Launch Tool
                            </button>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-4 divide-x divide-white/5 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
                            <Stat label="TOOLS LIVE" value="120+" sub="Across all categories" />
                            <Stat label="CATEGORIES" value="6" sub="Image · Video · Code · Docs..." />
                            <Stat label="AI MODELS" value="30+" sub="Via OpenRouter API" />
                            <Stat label="TASKS DONE" value="1.2M" sub="Platform-wide sessions" />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {["Image", "Video", "Code", "Docs", "Agentic", "Builder"].map((t) => (
                                <div
                                    key={t}
                                    className="rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-3 py-3 text-[11px] text-white/70"
                                >
                                    {t}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function SideItem({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 text-[10px] text-white/60">
            <span className="text-white/50">{icon}</span>
            {label}
        </div>
    );
}

function Recent({ label, dot }: { label: string; dot: string }) {
    return (
        <div className="flex items-center gap-2 text-[10px] text-white/45">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
            <span className="truncate">{label}</span>
        </div>
    );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div className="px-3 py-3">
            <div className="text-[8px] tracking-wider text-white/35">{label}</div>
            <div className="text-xl font-medium text-white mt-0.5">{value}</div>
            <div className="text-[8px] text-white/30 mt-0.5 truncate">{sub}</div>
        </div>
    );
}
