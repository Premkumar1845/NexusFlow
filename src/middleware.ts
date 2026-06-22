import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase auth session on every request so Server Components
 * always see a valid user. No-ops when Supabase env vars are not set.
 */
export async function middleware(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // OAuth safety net: if a provider returns the PKCE `code` to any route other
    // than the dedicated callback (Supabase sometimes falls back to the Site URL
    // root), forward it to /auth/callback so the session actually gets created.
    const { pathname, searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    if (code && pathname !== "/auth/callback") {
        const callbackUrl = request.nextUrl.clone();
        callbackUrl.pathname = "/auth/callback";
        if (!callbackUrl.searchParams.get("next")) {
            callbackUrl.searchParams.set("next", "/dashboard");
        }
        return NextResponse.redirect(callbackUrl);
    }

    let response = NextResponse.next({ request });
    if (!url || !anon) return response;

    const supabase = createServerClient(url, anon, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet: CookieToSet[]) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    await supabase.auth.getUser();
    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
