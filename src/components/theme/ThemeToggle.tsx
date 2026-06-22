"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";
const LS_KEY = "nexusflow.theme";

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
}

/**
 * Light / dark mode toggle. Persists the choice to localStorage and applies
 * a `light` class on <html> that the global stylesheet keys off of.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        const stored = (localStorage.getItem(LS_KEY) as Theme | null) ?? "dark";
        setTheme(stored);
        applyTheme(stored);
    }, []);

    function toggle() {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
        localStorage.setItem(LS_KEY, next);
    }

    return (
        <button
            onClick={toggle}
            className={`grid place-items-center w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 text-white/70 transition-colors ${className}`}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4" />
            ) : (
                <Moon className="w-4 h-4" />
            )}
        </button>
    );
}
