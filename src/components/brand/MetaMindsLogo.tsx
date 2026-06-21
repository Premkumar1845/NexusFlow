import type { SVGProps } from "react";

/**
 * MetaMinds infinity mark — used in the "Powered by MetaMinds" footer credit.
 * The team's signature infinity glyph with a subtle blue→violet flow.
 */
export function MetaMindsMark({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 64 32"
            fill="none"
            role="img"
            aria-label="MetaMinds"
            className={className}
            {...props}
        >
            <defs>
                <linearGradient id="mm-grad" x1="0" y1="16" x2="64" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2f8bff" />
                    <stop offset="0.5" stopColor="#7c5cff" />
                    <stop offset="1" stopColor="#b06bff" />
                </linearGradient>
            </defs>
            <path
                d="M16 6c-6 0-10 4-10 10s4 10 10 10c5 0 8-3 11-7l5-6c3-4 6-7 11-7 6 0 10 4 10 10s-4 10-10 10c-5 0-8-3-11-7l-5-6c-3-4-6-7-11-7Z"
                stroke="url(#mm-grad)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Inline MetaMinds wordmark + mark, for footers/credits. */
export function MetaMindsLogo({
    className = "",
    dark = false,
}: {
    className?: string;
    dark?: boolean;
}) {
    return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <MetaMindsMark className="h-3.5 w-7" />
            <span
                className={`text-xs font-semibold tracking-wide ${dark ? "text-white/80" : "text-gray-700"
                    }`}
            >
                MetaMinds
            </span>
        </span>
    );
}

export default MetaMindsLogo;
