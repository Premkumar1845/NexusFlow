"use client";

import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { detectCategory } from "@/lib/categories";

/**
 * Hero search bar — NexusFlow's primary CTA. Detects the tool category from
 * the query and routes to the dashboard (in-app, no external redirect).
 */
export default function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (!q) {
            router.push("/dashboard");
            return;
        }
        const category = detectCategory(q);
        const params = new URLSearchParams({ q });
        if (category) params.set("category", category);
        router.push(`/dashboard?${params.toString()}`);
    }

    return (
        <form
            onSubmit={submit}
            className="animate-fade-up [animation-delay:220ms] mt-5 sm:mt-6 w-full max-w-xl"
        >
            <div className="flex items-center gap-3 rounded-full bg-white/60 backdrop-blur-md ring-1 ring-gray-200 pl-5 pr-1.5 py-1.5 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-gray-300">
                <input
                    autoFocus={autoFocus}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500 outline-none py-2"
                    placeholder="Search AI tools — image, video, code, docs, agentic, builders..."
                    aria-label="Search AI tools"
                />
                <button
                    type="submit"
                    aria-label="Launch"
                    className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-900 text-white hover:scale-105 active:scale-95 transition-transform shrink-0"
                >
                    <ArrowUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
            </div>
        </form>
    );
}
