"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { isDemo, supabase } from "@/lib/supabase";

type AuthState = {
  user: User | null;
  loading: boolean;
  // Demo mode has no accounts, so anyone can log and claim on their own device.
  canWrite: boolean;
  name: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const noopSubscribe = () => () => {};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(!supabase);
  // False in the build-time HTML, so forms (which default to "now" and the
  // user's name) only ever render in the browser.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const loading = !mounted || !sessionLoaded;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    user,
    loading,
    canWrite: isDemo || !!user,
    name: (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "",
    async signIn() {
      if (!supabase) return;
      // Google sends the user back to the page they started from.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
      if (error) alert(error.message);
    },
    async signOut() {
      await supabase?.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();
  if (isDemo || loading) return null;
  if (!user) {
    return (
      <button onClick={signIn} className="ml-auto rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700">
        Sign in with Google
      </button>
    );
  }
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
      <button onClick={signOut} className="underline">
        Sign out
      </button>
    </span>
  );
}

// Wraps anything that writes data: shows a sign-in prompt instead when needed.
export function RequireSignIn({ children, action }: { children: ReactNode; action: string }) {
  const { canWrite, loading, signIn } = useAuth();
  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (canWrite) return <>{children}</>;
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="mb-3">Sign in with your Google account to {action}.</p>
      <button onClick={signIn} className="rounded bg-orange-600 px-4 py-2 font-semibold text-white">
        Sign in with Google
      </button>
    </div>
  );
}

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      Demo mode: reports are saved in this browser only. Google sign-in and shared reports turn on once the database is connected.
    </div>
  );
}
