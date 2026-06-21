"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { NexusLogo } from "@/components/brand/Logo";
import { MetaMindsLogo } from "@/components/brand/MetaMindsLogo";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const isSignup = mode === "signup";

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setNotice(null);
        setLoading(true);

        const supabase = createClient();

        // Demo mode: no Supabase configured — proceed straight to the dashboard.
        if (!supabase) {
            router.push("/dashboard");
            return;
        }

        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                    },
                });
                if (error) throw error;
                setNotice(
                    "Check your inbox to confirm your email, then log in. Redirecting…"
                );
                setTimeout(() => router.push("/login"), 2200);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setLoading(false);
        }
    }

    async function onGoogle() {
        const supabase = createClient();
        if (!supabase) {
            router.push("/dashboard");
            return;
        }
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
    }

    return (
        <main className="min-h-screen grid place-items-center bg-gradient-to-b from-white via-gray-50 to-gray-100 px-4">
            <div className="w-full max-w-sm">
                {/* Logo — top center */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <NexusLogo size={44} />
                    </Link>
                </div>

                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-6 sm:p-7">
                    <h1 className="text-xl font-semibold text-gray-900 text-center">
                        {isSignup ? "Create your account" : "Welcome back"}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 text-center">
                        {isSignup
                            ? "Start using every AI tool under one roof."
                            : "Log in to access your AI workspace."}
                    </p>

                    <form onSubmit={onSubmit} className="mt-6 space-y-3">
                        <Field
                            icon={<Mail className="w-4 h-4" />}
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={setEmail}
                            autoComplete="email"
                        />
                        <Field
                            icon={<Lock className="w-4 h-4" />}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={setPassword}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            minLength={6}
                        />

                        {error && (
                            <p className="text-xs text-[#ff5f57] bg-red-50 rounded-md px-3 py-2">
                                {error}
                            </p>
                        )}
                        {notice && (
                            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-md px-3 py-2">
                                {notice}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[#1A56DB] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#1748b8] transition-colors disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {isSignup ? "Create account" : "Log in"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-4 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">or</span>
                        <span className="h-px flex-1 bg-gray-200" />
                    </div>

                    <button
                        onClick={onGoogle}
                        className="w-full flex items-center justify-center gap-2 ring-1 ring-gray-300 text-sm font-medium text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    <p className="mt-5 text-center text-sm text-gray-600">
                        {isSignup ? (
                            <>
                                Already have an account?{" "}
                                <Link href="/login" className="text-[#1A56DB] font-medium hover:underline">
                                    Log in
                                </Link>
                            </>
                        ) : (
                            <>
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-[#1A56DB] font-medium hover:underline">
                                    Create new account
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {/* Footer — Powered by MetaMinds */}
                <div className="mt-6 flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-500">Powered by</span>
                    <MetaMindsLogo />
                </div>
            </div>
        </main>
    );
}

function Field({
    icon,
    type,
    placeholder,
    value,
    onChange,
    autoComplete,
    minLength,
}: {
    icon: React.ReactNode;
    type: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    minLength?: number;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg ring-1 ring-gray-300 px-3 focus-within:ring-2 focus-within:ring-[#1A56DB]">
            <span className="text-gray-400">{icon}</span>
            <input
                required
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                minLength={minLength}
                className="flex-1 bg-transparent py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.44 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 4.75 12 4.75Z" />
        </svg>
    );
}
