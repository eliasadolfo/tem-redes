import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Cliente Supabase, o null si faltan las variables de entorno. */
export const supabase = url && key ? createClient(url, key) : null;

/** true si la app está conectada a Supabase (si no, corre con mock local). */
export const hasSupabase = supabase !== null;
