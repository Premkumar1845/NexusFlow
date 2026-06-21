import type { SVGProps } from "react";

/**
 * NexusFlow brand mark — a connected-node network forming an "N",
 * symbolising a "nexus" of AI tools and the "flow" between them.
 * Renders in `currentColor` by default so it adapts to any surface.
 */
export function NexusMark({
    className,
    ...props
}: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            role="img"
            aria-label="NexusFlow"
            className={className}
            {...props}
        >
            {/* connections */}
            <g
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M14 35V13" />
                <path d="M14 13l20 22" />
                <path d="M34 35V13" />
            </g>
            {/* nodes */}
            <g fill="currentColor">
                <circle cx="14" cy="13" r="4.4" />
                <circle cx="14" cy="35" r="4.4" />
                <circle cx="34" cy="13" r="4.4" />
                <circle cx="34" cy="35" r="4.4" />
            </g>
        </svg>
    );
}

type LogoProps = {
    /** Pixel size of the square tile mark. */
    size?: number;
    /** Show the "NexusFlow" wordmark beside the mark. */
    withWordmark?: boolean;
    /** Color the wordmark for dark surfaces. */
    dark?: boolean;
    className?: string;
};

/**
 * Full NexusFlow logo: brand-blue rounded tile + glyph, optional wordmark.
 */
export function NexusLogo({
    size = 36,
    withWordmark = true,
    dark = false,
    className = "",
}: LogoProps) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <span
                className="relative inline-flex shrink-0 items-center justify-center rounded-[28%] shadow-sm"
                style={{
                    width: size,
                    height: size,
                    background:
                        "linear-gradient(135deg, #1a56db 0%, #2f6df0 55%, #1748b8 100%)",
                }}
            >
                <NexusMark
                    className="text-white"
                    style={{ width: size * 0.7, height: size * 0.7 }}
                />
            </span>
            {withWordmark && (
                <span
                    className={`text-[1.05rem] font-semibold tracking-tight ${dark ? "text-white" : "text-gray-900"
                        }`}
                >
                    Nexus<span className="text-brand">Flow</span>
                </span>
            )}
        </span>
    );
}

export default NexusLogo;
