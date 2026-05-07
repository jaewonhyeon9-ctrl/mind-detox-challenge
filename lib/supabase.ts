import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Participant = {
  id: number;
  name: string;
  display_order: number;
};

export type LogRow = {
  participant_id: number;
  date: string;
};
