"use client";

import {
    Compass,
    Layers,
    ListTodo,
    Grid,
    Plus,
    PanelLeftClose,
    Trash2,
    Archive,
    ArchiveRestore,
} from "lucide-react";
import { NexusMark } from "@/components/brand/Logo";
import { CATEGORY_MAP } from "@/lib/categories";
import type { NexusSession } from "@/lib/sessions";

type View = "discover" | "categories" | "history" | "archived";

const STATUS_DOT: Record<NexusSession["status"], string> = {
    done: "#28c840",
    running: "#febc2e",
    draft: "#6b7280",
};

export default function Sidebar({
    sessions,
    activeId,
    view,
    onView,
    onSelect,
    onNew,
    onClose,
    onDelete,
    onArchive,
}: {
    sessions: NexusSession[];
    activeId?: string;
    view: View;
    onView: (v: View) => void;
    onSelect: (s: NexusSession) => void;
    onNew: () => void;
    onClose?: () => void;
    onDelete?: (s: NexusSession) => void;
    onArchive?: (s: NexusSession, archived: boolean) => void;
}) {
    const recent = sessions.filter((s) => !s.archived);
    const archived = sessions.filter((s) => s.archived);

    return (
        <aside className="flex h-full w-64 flex-col bg-[#1e1e21] border-r border-white/5 px-3 py-3.5">
            {/* Logo row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                    <NexusMark className="w-4 h-4 text-white/70" />
                    <Grid className="w-3.5 h-3.5 text-white/30" />
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded text-white/40 hover:text-white/70"
                        aria-label="Close sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Workspace badge */}
            <div className="flex items-center gap-2 mb-4">
                <span className="grid place-items-center w-5 h-5 rounded bg-[#1A56DB] text-white text-[10px] font-semibold">
                    N
                </span>
                <span className="text-[11px] text-white/80">NexusFlow</span>
            </div>

            {/* New session */}
            <button
                onClick={onNew}
                className="flex items-center gap-2 w-full text-[12px] text-white bg-[#1A56DB] hover:bg-[#1748b8] rounded-lg px-3 py-2 mb-3 transition-colors"
            >
                <Plus className="w-3.5 h-3.5" /> New session
            </button>

            {/* Nav */}
            <nav className="space-y-0.5">
                <NavItem
                    icon={<Compass className="w-3.5 h-3.5" />}
                    label="Discover"
                    hint="Browse all AI tools"
                    active={view === "discover"}
                    onClick={() => onView("discover")}
                />
                <NavItem
                    icon={<Layers className="w-3.5 h-3.5" />}
                    label="Categories"
                    hint="Image · Video · Code · Docs…"
                    active={view === "categories"}
                    onClick={() => onView("categories")}
                />
                <NavItem
                    icon={<ListTodo className="w-3.5 h-3.5" />}
                    label="History"
                    hint="All previous sessions"
                    active={view === "history"}
                    onClick={() => onView("history")}
                />
            </nav>

            {/* Recent sessions */}
            <div className="mt-5 flex-1 min-h-0 flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-white/30 px-2 mb-2">
                    Recent
                </div>
                <div className="nf-scroll flex-1 overflow-y-auto space-y-0.5 pr-1">
                    {recent.length === 0 && (
                        <p className="text-[11px] text-white/30 px-2">
                            No sessions yet. Launch a tool to get started.
                        </p>
                    )}
                    {recent.map((s) => (
                        <SessionRow
                            key={s.id}
                            session={s}
                            active={activeId === s.id}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onArchive={onArchive}
                        />
                    ))}
                </div>
            </div>

            {/* Archived — opens the archive interface */}
            <button
                onClick={() => onView("archived")}
                className={`mt-2 flex items-center gap-2 w-full rounded-lg px-3 py-2 transition-colors ${view === "archived"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5"
                    }`}
            >
                <Archive className="w-3.5 h-3.5" />
                <span className="text-[12px]">Archived</span>
                <span className="ml-auto text-[10px] text-white/40 bg-white/5 rounded-full px-1.5 py-0.5">
                    {archived.length}
                </span>
            </button>
        </aside>
    );
}

function SessionRow({
    session: s,
    active,
    onSelect,
    onDelete,
    onArchive,
}: {
    session: NexusSession;
    active: boolean;
    onSelect: (s: NexusSession) => void;
    onDelete?: (s: NexusSession) => void;
    onArchive?: (s: NexusSession, archived: boolean) => void;
}) {
    const cat = CATEGORY_MAP[s.tool_category];
    const Icon = cat?.icon ?? ListTodo;
    return (
        <div
            className={`group flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors ${active ? "bg-white/10" : "hover:bg-white/5"
                }`}
        >
            <button
                onClick={() => onSelect(s)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
                <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="flex-1 truncate text-[11px] text-white/70">
                    {s.prompt || cat?.name || "Untitled"}
                </span>
            </button>

            {/* Hover actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onArchive && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onArchive(s, !s.archived);
                        }}
                        className="p-0.5 rounded text-white/40 hover:text-white/80 hover:bg-white/10"
                        aria-label={s.archived ? "Unarchive session" : "Archive session"}
                        title={s.archived ? "Unarchive" : "Archive"}
                    >
                        {s.archived ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                            <Archive className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(s);
                        }}
                        className="p-0.5 rounded text-white/40 hover:text-[#ff5f57] hover:bg-white/10"
                        aria-label="Delete session"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <span
                className="w-1.5 h-1.5 rounded-full shrink-0 group-hover:hidden"
                style={{ background: STATUS_DOT[s.status] }}
            />
        </div>
    );
}

function NavItem({
    icon,
    label,
    hint,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    hint: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 transition-colors ${active ? "bg-white/10" : "hover:bg-white/5"
                }`}
            title={hint}
        >
            <span className={active ? "text-[#5b8def]" : "text-white/50"}>{icon}</span>
            <span className="text-[12px] text-white/80">{label}</span>
        </button>
    );
}
