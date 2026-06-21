import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCategory, detectCategory, type CategoryId } from "@/lib/categories";

export const metadata = { title: "Dashboard — NexusFlow" };

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; category?: string }>;
}) {
    const { q = "", category } = await searchParams;

    // Gate on auth only when Supabase is actually configured.
    if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
        if (!data.user) redirect("/login");
    }

    // Resolve the initial category from the explicit param or the query text.
    let initialCategory: CategoryId | null = null;
    if (category && getCategory(category)) {
        initialCategory = category as CategoryId;
    } else if (q) {
        initialCategory = detectCategory(q);
    }

    return <DashboardClient initialCategory={initialCategory} initialQuery={q} />;
}
