import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Returns true if real Supabase credentials are configured in the environment.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes("placeholder") || supabaseUrl.includes("your-project")) return false;
  return true;
}

// Fallback safely to prevent client creation throwing fatal runtime error if variables are unset
const safeUrl = supabaseUrl && supabaseUrl.startsWith("http") ? supabaseUrl : "https://placeholder.supabase.co";
const safeAnonKey = supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

type CookieStore = {
  getAll?: () => Array<{ name: string; value: string }>;
  set?: (...args: unknown[]) => void;
};

export const getServerSupabase = (cookieStore: CookieStore) => {
  return createServerClient(safeUrl, safeAnonKey, {
    cookies: {
      getAll() {
        return cookieStore?.getAll ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet: CookieOptionsWithName[]) {
        try {
          cookiesToSet.forEach(({ name, value, ...options }) =>
            cookieStore?.set?.(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
};
