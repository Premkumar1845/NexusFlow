import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Pin the workspace root so Next doesn't pick up an unrelated parent lockfile.
    outputFileTracingRoot: __dirname,
    turbopack: {
        root: __dirname,
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "**" },
        ],
    },
};

export default nextConfig;
