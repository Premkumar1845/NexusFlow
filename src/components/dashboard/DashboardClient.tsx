"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Menu,
    ChevronLeft,
    LogOut,
    User as UserIcon,
    Archive,
    ArchiveRestore,
    Trash2,
} from "lucide-react";
import { NexusMark } from "@/components/brand/Logo";
import { CATEGORY_MAP, type CategoryId } from "@/lib/categories";
import {
    listSessions,
    deleteSession,
    setArchived,
    type NexusSession,
} from "@/lib/sessions";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "./Sidebar";
import DiscoverView from "./DiscoverView";
import ToolWorkspace from "@/components/tools/ToolWorkspace";
import ThemeToggle from "@/components/theme/ThemeToggle";

type View = "discover" | "categories" | "history" | "archived";

export default function DashboardClient({
    initialCategory,
    initialQuery,
}: {
    initialCategory: CategoryId | null;
    initialQuery: string;
}) {
    const router = useRouter();
    const [view, setView] = useState<View>("discover");
    const [activeCategory, setActiveCategory] = useState<CategoryId | null>(
        initialCategory
    );
    const [query, setQuery] = useState(initialQuery);
    const [resume, setResume] = useState<NexusSession | null>(null);
    const [sessions, setSessions] = useState<NexusSession[]>([]);
    const [email, setEmail] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        listSessions().then(setSessions);
        const supabase = createClient();
        supabase?.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null);
        });
    }, []);

    function pick(id: CategoryId, q?: string) {
        setActiveCategory(id);
        setResume(null);
        if (q !== undefined) setQuery(q);
        setSidebarOpen(false);
    }

    function selectSession(s: NexusSession) {
        setActiveCategory(s.tool_category);
        setResume(s);
        setSidebarOpen(false);
    }

    function newSession() {
        setActiveCategory(null);
        setResume(null);
        setQuery("");
        setView("discover");
        setSidebarOpen(false);
    }

    function onSession(saved: NexusSession) {
        setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === saved.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
            }
            return [saved, ...prev];
        });
    }

    async function logout() {
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        router.push("/");
    }

    async function removeSession(s: NexusSession) {
        setSessions((prev) => prev.filter((x) => x.id !== s.id));
        if (resume?.id === s.id) {
            setResume(null);
            setActiveCategory(null);
        }
        try {
            await deleteSession(s.id);
        } catch {
            // best-effort; reload to resync on failure
            listSessions().then(setSessions);
        }
    }

    async function archiveSession(s: NexusSession, archived: boolean) {
        setSessions((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, archived } : x))
        );
        try {
            await setArchived(s.id, archived);
        } catch {
            listSessions().then(setSessions);
        }
    }

    const category = activeCategory ? CATEGORY_MAP[activeCategory] : null;

    return (
        <div className="flex h-screen bg-[#1a1a1c] text-white overflow-hidden">
            {/* Sidebar — desktop */}
            <div className="hidden lg:flex shrink-0">
                <Sidebar
                    sessions={sessions}
                    activeId={resume?.id}
                    view={view}
                    onView={(v) => {
                        setView(v);
                        if (v !== "categories") setActiveCategory(null);
                    }}
                    onSelect={selectSession}
                    onNew={newSession}
                    onDelete={removeSession}
                    onArchive={archiveSession}
                />
            </div>

            {/* Sidebar — mobile drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0">
                        <Sidebar
                            sessions={sessions}
                            activeId={resume?.id}
                            view={view}
                            onView={(v) => {
                                setView(v);
                                if (v !== "categories") setActiveCategory(null);
                                setSidebarOpen(false);
                            }}
                            onSelect={selectSession}
                            onNew={newSession}
                            onClose={() => setSidebarOpen(false)}
                            onDelete={removeSession}
                            onArchive={archiveSession}
                        />
                    </div>
                </div>
            )}

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex items-center gap-3 border-b border-white/5 px-4 sm:px-5 py-3 shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-1.5 rounded-md text-white/60 hover:bg-white/5"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {category && (
                        <button
                            onClick={newSession}
                            className="hidden sm:flex items-center gap-1 text-xs text-white/50 hover:text-white/80"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    <div className="flex items-center gap-2.5">
                        <span className="grid place-items-center w-9 h-9">
                            <NexusMark className="w-8 h-8" />
                        </span>
                        <div className="leading-tight">
                            <div className="text-sm font-medium text-white">NexusFlow</div>
                            <div className="text-[10px] text-white/45">
                                AI tools under one roof
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={newSession}
                        className="ml-auto flex items-center gap-1.5 bg-[#1A56DB] hover:bg-[#1748b8] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Launch Tool</span>
                    </button>

                    {/* Theme toggle */}
                    <ThemeToggle />

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            className="grid place-items-center w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                            aria-label="Account"
                        >
                            <UserIcon className="w-4 h-4 text-white/70" />
                        </button>
                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 z-20 rounded-xl bg-[#242427] ring-1 ring-white/10 shadow-xl p-1.5">
                                    <div className="px-3 py-2 border-b border-white/5">
                                        <div className="text-[11px] text-white/40">Signed in as</div>
                                        <div className="text-xs text-white/80 truncate">
                                            {email ?? "Guest (demo mode)"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-2 w-full text-left text-xs text-white/70 hover:bg-white/5 rounded-lg px-3 py-2 mt-1"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        {email ? "Log out" : "Exit to home"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                {/* Content */}
                <main className="nf-scroll flex-1 overflow-y-auto p-4 sm:p-6">
                    {category ? (
                        <div className="mx-auto max-w-3xl">
                            <ToolWorkspace
                                category={category}
                                initialPrompt={query}
                                resume={resume}
                                onSession={onSession}
                            />
                        </div>
                    ) : view === "history" ? (
                        <HistoryView sessions={sessions} onSelect={selectSession} />
                    ) : view === "archived" ? (
                        <ArchivedView
                            sessions={sessions}
                            onSelect={selectSession}
                            onRestore={(s) => archiveSession(s, false)}
                            onDelete={removeSession}
                        />
                    ) : (
                        <DiscoverView initialQuery={query} onPick={pick} />
                    )}
                </main>
            </div>
        </div>
    );
}

function HistoryView({
    sessions,
    onSelect,
}: {
    sessions: NexusSession[];
    onSelect: (s: NexusSession) => void;
}) {
    const dot: Record<NexusSession["status"], string> = {
        done: "#28c840",
        running: "#febc2e",
        draft: "#6b7280",
    };
    return (
        <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-white mb-1">Session history</h2>
            <p className="text-sm text-white/45 mb-5">
                Resume any past session with its prompt and output restored.
            </p>
            {sessions.length === 0 ? (
                <p className="text-sm text-white/40">No sessions yet.</p>
            ) : (
                <div className="space-y-2">
                    {sessions.map((s) => {
                        const cat = CATEGORY_MAP[s.tool_category];
                        const Icon = cat?.icon ?? Sparkles;
                        return (
                            <button
                                key={s.id}
                                onClick={() => onSelect(s)}
                                className="flex items-center gap-3 w-full text-left rounded-xl bg-white/[0.03] ring-1 ring-white/5 hover:ring-[#1A56DB]/40 px-4 py-3 transition-all"
                            >
                                <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#1A56DB]/15 ring-1 ring-[#1A56DB]/30 shrink-0">
                                    <Icon className="w-4 h-4 text-[#5b8def]" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm text-white truncate">
                                        {s.prompt || cat?.name}
                                    </div>
                                    <div className="text-[11px] text-white/40">
                                        {cat?.name} · {new Date(s.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: dot[s.status] }}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ArchivedView({
    sessions,
    onSelect,
    onRestore,
    onDelete,
}: {
    sessions: NexusSession[];
    onSelect: (s: NexusSession) => void;
    onRestore: (s: NexusSession) => void;
    onDelete: (s: NexusSession) => void;
}) {
    const archived = sessions.filter((s) => s.archived);
    return (
        <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 mb-1">
                <Archive className="w-5 h-5 text-white/70" />
                <h2 className="text-lg font-semibold text-white">Archived sessions</h2>
            </div>
            <p className="text-sm text-white/45 mb-5">
                Restore an archived session back to Recent, or delete it permanently.
            </p>
            {archived.length === 0 ? (
                <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/5 px-6 py-10 text-center">
                    <Archive className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">No archived sessions yet.</p>
                    <p className="text-xs text-white/30 mt-1">
                        Use the archive icon on a recent session to move it here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {archived.map((s) => {
                        const cat = CATEGORY_MAP[s.tool_category];
                        const Icon = cat?.icon ?? Sparkles;
                        return (
                            <div
                                key={s.id}
                                className="group flex items-center gap-3 w-full rounded-xl bg-white/[0.03] ring-1 ring-white/5 hover:ring-[#1A56DB]/40 px-4 py-3 transition-all"
                            >
                                <button
                                    onClick={() => onSelect(s)}
                                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                >
                                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#1A56DB]/15 ring-1 ring-[#1A56DB]/30 shrink-0">
                                        <Icon className="w-4 h-4 text-[#5b8def]" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm text-white truncate">
                                            {s.prompt || cat?.name}
                                        </div>
                                        <div className="text-[11px] text-white/40">
                                            {cat?.name} · {new Date(s.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onRestore(s)}
                                        className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-colors"
                                        title="Restore to Recent"
                                    >
                                        <ArchiveRestore className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Restore</span>
                                    </button>
                                    <button
                                        onClick={() => onDelete(s)}
                                        className="grid place-items-center text-white/50 hover:text-[#ff5f57] bg-white/5 hover:bg-white/10 rounded-lg w-8 h-8 transition-colors"
                                        title="Delete permanently"
                                        aria-label="Delete session"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
