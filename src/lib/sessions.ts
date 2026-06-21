"use client";

import { createClient } from "./supabase/client";
import type { CategoryId } from "./categories";

export type SessionStatus = "done" | "running" | "draft";

export type NexusSession = {
    id: string;
    tool_category: CategoryId;
    model: string;
    prompt: string;
    output: string;
    status: SessionStatus;
    created_at: string;
};

const LS_KEY = "nexusflow.sessions";

/* ── localStorage fallback (demo mode, no Supabase) ─────────────────── */
function readLocal(): NexusSession[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function writeLocal(items: NexusSession[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 100)));
}

/* ── Public API ─────────────────────────────────────────────────────── */

export async function listSessions(): Promise<NexusSession[]> {
    const supabase = createClient();
    if (!supabase) return readLocal();

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return readLocal();

    const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
    return (data as NexusSession[]) ?? [];
}

export async function saveSession(
    input: Omit<NexusSession, "id" | "created_at"> & { id?: string }
): Promise<NexusSession> {
    const now = new Date().toISOString();
    const supabase = createClient();

    if (!supabase) {
        const items = readLocal();
        const id = input.id ?? crypto.randomUUID();
        const existingIdx = items.findIndex((s) => s.id === id);
        const record: NexusSession = {
            id,
            created_at: existingIdx >= 0 ? items[existingIdx].created_at : now,
            tool_category: input.tool_category,
            model: input.model,
            prompt: input.prompt,
            output: input.output,
            status: input.status,
        };
        if (existingIdx >= 0) items[existingIdx] = record;
        else items.unshift(record);
        writeLocal(items);
        return record;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
        // Signed out but Supabase configured — keep it local.
        const items = readLocal();
        const record: NexusSession = {
            id: input.id ?? crypto.randomUUID(),
            created_at: now,
            ...input,
        } as NexusSession;
        items.unshift(record);
        writeLocal(items);
        return record;
    }

    const payload = {
        id: input.id,
        user_id: auth.user.id,
        tool_category: input.tool_category,
        model: input.model,
        prompt: input.prompt,
        output: input.output,
        status: input.status,
    };

    const { data, error } = await supabase
        .from("sessions")
        .upsert(payload)
        .select()
        .single();

    if (error) throw error;
    return data as NexusSession;
}
