import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "NexusFlow — AI tools under one roof",
    description:
        "Discover and use AI tools for image, video, code, docs, agents and app building — without ever leaving NexusFlow. Built by MetaMinds.",
    icons: {
        icon: "/nexusflow-logo.png",
    },
    applicationName: "NexusFlow",
    keywords: ["AI", "tools", "image generation", "code", "agents", "NexusFlow", "MetaMinds"],
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#1a1a1c",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
