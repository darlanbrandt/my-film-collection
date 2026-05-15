import { createClient } from "@supabase/supabase-js";

export const APP_PASSWORD  = import.meta.env.VITE_APP_PASSWORD || null;
export const PROXY         = "https://tmdb-proxy.darlanbrandt.workers.dev";
export const TMDB_IMG      = "https://image.tmdb.org/t/p/w500";
export const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
export const PAGE_SIZE     = 24;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
