"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { NexusLogo } from "@/components/brand/Logo";
import { MetaMindsLogo } from "@/components/brand/MetaMindsLogo";
import SearchBar from "@/components/hero/SearchBar";
import ScaledDashboard from "@/components/hero/ScaledDashboard";
import Hero3DBackground from "@/components/hero/Hero3DBackground";

export default function HomePage() {
    const [showDemo, setShowDemo] = useState(false);

    return (
        <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-gray-100">
            {/* Layered neutral background: blurred blobs + interactive 3D field */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gray-200/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gray-200/30 blur-3xl" />
                <Hero3DBackground />
            </div>

            {/* Navbar */}
            <header className="relative z-10 w-full">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                    <NexusLogo size={32} />
                    <nav className="flex items-center gap-1.5 sm:gap-3">
                        <Link
                            href="/login"
                            className="rounded-full px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:px-4"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="rounded-full bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:px-4"
                        >
                            Sign up
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
                {/* top spacer */}
                <div className="min-h-6 flex-1 shrink-0 sm:min-h-12 lg:min-h-16" />

                <div className="flex w-full max-w-3xl flex-col items-center">
                    <h1 className="font-normal leading-[1.05] tracking-tight text-gray-900 text-[clamp(2.25rem,9vw,5rem)] xl:text-[80px]">
                        <span className="block animate-fade-up">Access AI Tools.</span>
                        <span className="block animate-fade-up [animation-delay:100ms]">
                            All in One Place.
                        </span>
                    </h1>

                    <SearchBar />

                    <p className="animate-fade-up [animation-delay:340ms] mt-4 inline-flex max-w-md items-start gap-1.5 text-sm leading-relaxed text-gray-600 sm:mt-5 sm:text-base lg:text-lg">
                        <Sparkles className="-mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                        <span>
                            Discover and use AI tools for image, video, code, docs, and more —
                            without ever leaving NexusFlow.
                        </span>
                    </p>

                    <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:460ms]">
                        <Link
                            href="/signup"
                            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
                        >
                            Try It Free
                        </Link>
                        <button
                            onClick={() => setShowDemo(true)}
                            className="rounded-full px-6 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition-colors hover:bg-gray-100"
                        >
                            Talk to Sales
                        </button>
                    </div>
                </div>

                <ScaledDashboard />

                {/* bottom spacer */}
                <div className="min-h-8 flex-1 shrink-0 sm:min-h-12 lg:min-h-16" />
            </section>

            {/* Footer */}
            <footer className="relative z-10 flex items-center justify-center gap-2 border-t border-gray-200 bg-gray-100/60 py-6">
                <span className="text-xs text-gray-500">Powered by</span>
                <MetaMindsLogo />
            </footer>

            {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
        </main>
    );
}

function DemoModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <NexusLogo size={28} />
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Let&apos;s talk</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Tell us about your team and we&apos;ll reach out. Everything stays
                    in-app — no redirects.
                </p>
                <form
                    className="mt-4 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                    onSubmit={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                >
                    <input
                        required
                        type="email"
                        placeholder="Work email"
                        className="w-full rounded-lg ring-1 ring-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-gray-900"
                    />
                    <textarea
                        placeholder="What would you like to build?"
                        rows={3}
                        className="w-full rounded-lg ring-1 ring-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-gray-900 resize-none"
                    />
                    <button className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
                        Request a demo
                    </button>
                </form>
            </div>
        </div>
    );
}
