import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / PKCE callback handler.
 *
 * Supabase redirects here with a `?code=...` after the user authenticates with
 * an external provider (e.g. Google). We exchange that code for a session
 * (setting the auth cookies) and then forward the user to their destination.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    // Where to land after a successful login (defaults to the dashboard).
    const next = searchParams.get("next") ?? "/dashboard";

    // Provider returned an error (e.g. user cancelled) — back to login.
    if (error) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
    }

    if (code) {
        const supabase = await createClient();
        if (supabase) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError) {
                return NextResponse.redirect(`${origin}${next}`);
            }
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
            );
        }
    }

    // No code / not configured — send the user back to login.
    return NextResponse.redirect(`${origin}/login`);
}
