import { supabase } from "./supabase.js";

/**
 * Converts a Supabase/Google OAuth redirect URL
 * into a Supabase session.
 *
 * Supports:
 * - PKCE: ?code=...
 * - Implicit flow: #access_token=...&refresh_token=...
 */
export async function createSessionFromUrl(url) {
  if (!url) return null;

  try {
    console.log("Processing OAuth URL:", url);

    const parsedUrl = new URL(url);

    // -----------------------------
    // 1. PKCE CODE FLOW
    // -----------------------------
    const code = parsedUrl.searchParams.get("code");

    if (code) {
      console.log("OAuth code detected. Exchanging for session...");

      const { data, error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Code exchange error:", error);
        throw error;
      }

      console.log(
        "Session created:",
        data?.session?.user?.email
      );

      return data?.session ?? null;
    }

    // -----------------------------
    // 2. IMPLICIT TOKEN FLOW
    // -----------------------------
    const hash = parsedUrl.hash;

    if (hash) {
      const hashParams = new URLSearchParams(
        hash.substring(1)
      );

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        console.log("OAuth tokens detected. Setting session...");

        const { data, error } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (error) {
          console.error("Token session error:", error);
          throw error;
        }

        console.log(
          "Session created:",
          data?.session?.user?.email
        );

        return data?.session ?? null;
      }
    }

    // -----------------------------
    // 3. OAUTH ERROR
    // -----------------------------
    const errorDescription =
      parsedUrl.searchParams.get("error_description");

    const errorCode =
      parsedUrl.searchParams.get("error");

    if (errorDescription || errorCode) {
      throw new Error(
        errorDescription || errorCode
      );
    }

    // -----------------------------
    // 4. FALLBACK
    // -----------------------------
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session ?? null;
  } catch (error) {
    console.error(
      "createSessionFromUrl error:",
      error
    );

    throw error;
  }
}