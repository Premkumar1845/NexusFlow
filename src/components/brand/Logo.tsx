import type { CSSProperties } from "react";

/** Path to the NexusFlow logo image (place the file in `public/`). */
const LOGO_SRC = "/nexusflow-logo.png";

type MarkProps = {
    className?: string;
    style?: CSSProperties;
};

/**
 * NexusFlow brand mark — renders the official logo image exactly as provided.
 */
export function NexusMark({ className = "", style }: MarkProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={LOGO_SRC}
            alt="NexusFlow"
            draggable={false}
            className={`object-contain ${className}`}
            style={style}
        />
    );
}

type LogoProps = {
    /** Pixel height of the mark (width scales with the wordmark lockup). */
    size?: number;
    /** Show the "NexusFlow" wordmark beside the mark. */
    withWordmark?: boolean;
    /** Color the wordmark for dark surfaces. */
    dark?: boolean;
    className?: string;
};

/**
 * Full NexusFlow logo: the official logo image + optional wordmark.
 */
export function NexusLogo({
    size = 36,
    withWordmark = true,
    dark = false,
    className = "",
}: LogoProps) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <NexusMark
                className="shrink-0"
                style={{ height: size, width: "auto" }}
            />
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
