import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as Linking from "expo-linking";

import { supabase } from "../lib/supabase";
import { createSessionFromUrl } from "../lib/authHelper";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ==========================================
    // 1. GET EXISTING SESSION
    // ==========================================

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "Initial session error:",
            error
          );
        }

        if (mounted) {
          setSession(session ?? null);
          setLoading(false);
        }

        console.log(
          "Initial session:",
          session?.user?.email ?? "No session"
        );
      } catch (error) {
        console.error(
          "Auth initialization error:",
          error
        );

        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // ==========================================
    // 2. SUPABASE AUTH STATE LISTENER
    // ==========================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "Supabase auth event:",
          event
        );

        console.log(
          "Authenticated user:",
          session?.user?.email ?? "No user"
        );

        if (mounted) {
          setSession(session ?? null);
          setLoading(false);
        }
      }
    );

    // ==========================================
    // 3. HANDLE OAUTH DEEP LINK
    // ==========================================

    const handleDeepLink = async (url) => {
      if (!url) return;

      console.log(
        "Received deep link:",
        url
      );

      const isOAuthCallback =
        url.includes("code=") ||
        url.includes("access_token=");

      if (!isOAuthCallback) {
        return;
      }

      try {
        const newSession =
          await createSessionFromUrl(url);

        if (newSession && mounted) {
          console.log(
            "OAuth login successful:",
            newSession.user?.email
          );

          setSession(newSession);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "OAuth deep link error:",
          error
        );
      }
    };

    // ==========================================
    // 4. LISTEN FOR DEEP LINKS
    // ==========================================

    const linkingSubscription =
      Linking.addEventListener(
        "url",
        ({ url }) => {
          handleDeepLink(url);
        }
      );

    // ==========================================
    // 5. HANDLE INITIAL DEEP LINK
    // ==========================================

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      mounted = false;

      subscription.unsubscribe();

      linkingSubscription.remove();
    };
  }, []);

  // ==========================================
  // EMAIL/PASSWORD SIGN UP
  // ==========================================

  const signUp = async ({
    fullName,
    email,
    password,
  }) => {
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return {
      data,
      error,
    };
  };

  // ==========================================
  // EMAIL/PASSWORD LOGIN
  // ==========================================

  const signIn = async ({
    email,
    password,
  }) => {
    const {
      data,
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      data,
      error,
    };
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    return {
      error,
    };
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);