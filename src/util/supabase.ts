import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY environment variables",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};
