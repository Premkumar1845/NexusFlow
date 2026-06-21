import type { LucideIcon } from "lucide-react";
import {
    Image as ImageIcon,
    Video,
    Code2,
    FileText,
    Workflow,
    LayoutTemplate,
} from "lucide-react";

export type CategoryId =
    | "image"
    | "video"
    | "code"
    | "docs"
    | "agentic"
    | "builder";

export type ModelOption = {
    id: string; // OpenRouter model slug
    label: string;
    provider: string;
};

export type Category = {
    id: CategoryId;
    name: string;
    tagline: string;
    description: string;
    icon: LucideIcon;
    /** Interface type the dashboard renders. */
    interface: "image" | "video" | "code" | "docs" | "agentic" | "builder";
    models: ModelOption[];
    /** Keywords used by the search router to detect this category. */
    keywords: string[];
    /** Example prompts shown in the tool's empty state. */
    examples: string[];
};

export const CATEGORIES: Category[] = [
    {
        id: "image",
        name: "Image Generation",
        tagline: "Prompt → image, inline",
        description: "Generate images from text using leading diffusion models.",
        icon: ImageIcon,
        interface: "image",
        models: [
            { id: "google/gemini-2.5-flash-image-preview", label: "Gemini 2.5 Flash Image", provider: "Google" },
            { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (free)", provider: "Google" },
        ],
        keywords: ["image", "picture", "photo", "art", "draw", "illustration", "logo", "render", "diffusion", "dall", "flux", "stable diffusion"],
        examples: [
            "A neon cyberpunk city skyline at dusk, ultra-detailed",
            "Minimalist logo for a coffee brand, flat vector",
            "Studio portrait of a robot, soft cinematic lighting",
        ],
    },
    {
        id: "video",
        name: "Video Generation",
        tagline: "Prompt → video, inline",
        description: "Turn prompts and images into short video clips.",
        icon: Video,
        interface: "video",
        models: [
            { id: "runwayml/gen-3", label: "Runway Gen-3", provider: "RunwayML" },
            { id: "kuaishou/kling-1.5", label: "Kling 1.5", provider: "Kuaishou" },
            { id: "pika/pika-1.5", label: "Pika 1.5", provider: "Pika" },
        ],
        keywords: ["video", "clip", "animation", "motion", "film", "movie", "runway", "kling", "pika"],
        examples: [
            "Drone shot flying over a misty mountain range at sunrise",
            "A paper plane gliding through a sunlit office, slow motion",
            "Looping animation of waves on a tropical beach",
        ],
    },
    {
        id: "code",
        name: "Code Generation",
        tagline: "Editor + runner",
        description: "Write, explain and refactor code with top coding models.",
        icon: Code2,
        interface: "code",
        models: [
            { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder", provider: "Qwen" },
            { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", provider: "OpenAI" },
            { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B", provider: "OpenAI" },
        ],
        keywords: ["code", "program", "function", "script", "python", "javascript", "typescript", "react", "bug", "debug", "algorithm", "api", "sql"],
        examples: [
            "Write a Python function to deduplicate a list preserving order",
            "Create a React hook for debounced search input",
            "Refactor this SQL query for better performance",
        ],
    },
    {
        id: "docs",
        name: "Notes / Documents",
        tagline: "Rich text editor",
        description: "Draft, edit and polish documents with an AI writing assistant.",
        icon: FileText,
        interface: "docs",
        models: [
            { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", provider: "OpenAI" },
            { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron Super 120B", provider: "NVIDIA" },
            { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", provider: "Meta" },
        ],
        keywords: ["write", "document", "doc", "note", "essay", "article", "blog", "summary", "summarize", "email", "letter", "report", "text"],
        examples: [
            "Write a product launch announcement for an AI platform",
            "Summarize the key points of agile project management",
            "Draft a polite follow-up email to a client",
        ],
    },
    {
        id: "agentic",
        name: "Agentic / Autonomous",
        tagline: "Pipeline builder",
        description: "Compose multi-step agent pipelines that plan and act.",
        icon: Workflow,
        interface: "agentic",
        models: [
            { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", provider: "OpenAI" },
            { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B", provider: "Nous Research" },
            { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron Ultra 550B", provider: "NVIDIA" },
        ],
        keywords: ["agent", "autonomous", "pipeline", "workflow", "automate", "multi-step", "research", "plan", "task"],
        examples: [
            "Research the top 3 EV makers and compare their margins",
            "Plan a 5-step launch checklist for a SaaS product",
            "Analyze a dataset description and propose next actions",
        ],
    },
    {
        id: "builder",
        name: "App / Website Builder",
        tagline: "Preview + download",
        description: "Describe an app or page and get runnable code with a live preview.",
        icon: LayoutTemplate,
        interface: "builder",
        models: [
            { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder", provider: "Qwen" },
            { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", provider: "OpenAI" },
            { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B", provider: "Google" },
        ],
        keywords: ["app", "website", "web", "page", "landing", "ui", "build", "component", "html", "css", "site", "dashboard"],
        examples: [
            "A landing page for a fitness app with a hero and pricing",
            "A single-page to-do app in HTML, CSS and JavaScript",
            "A pricing table component with three tiers",
        ],
    },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {} as Record<CategoryId, Category>
);

export function getCategory(id: string | null | undefined): Category | undefined {
    if (!id) return undefined;
    return CATEGORY_MAP[id as CategoryId];
}

/**
 * Lightweight keyword router: maps a free-text query to the best category.
 * Returns the category id with the most keyword hits, or null if none match.
 */
export function detectCategory(query: string): CategoryId | null {
    const q = query.toLowerCase();
    let best: { id: CategoryId; score: number } | null = null;

    for (const cat of CATEGORIES) {
        let score = 0;
        for (const kw of cat.keywords) {
            if (q.includes(kw)) score += kw.includes(" ") ? 2 : 1;
        }
        if (score > 0 && (!best || score > best.score)) {
            best = { id: cat.id, score };
        }
    }
    return best?.id ?? null;
}
