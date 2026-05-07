import ChallengeBoard from "@/components/ChallengeBoard";
import { supabase, type Participant, type LogRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadData(): Promise<{
  participants: Participant[];
  logs: LogRow[];
  error: string | null;
}> {
  const [{ data: participants, error: pErr }, { data: logs, error: lErr }] =
    await Promise.all([
      supabase
        .from("mdc_participants")
        .select("id, name, display_order")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("mdc_logs").select("participant_id, date"),
    ]);

  if (pErr || lErr) {
    return {
      participants: [],
      logs: [],
      error:
        pErr?.message ||
        lErr?.message ||
        "Verbindung zur Datenbank fehlgeschlagen.",
    };
  }
  return {
    participants: (participants ?? []) as Participant[],
    logs: (logs ?? []) as LogRow[],
    error: null,
  };
}

export default async function Page() {
  const { participants, logs, error } = await loadData();

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Mind Detox Challenge</h1>
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
          <br />
          <span className="opacity-70">
            Bitte SQL-Migration in Supabase ausführen und Seed-Skript starten.
          </span>
        </p>
      </main>
    );
  }

  return <ChallengeBoard initialParticipants={participants} initialLogs={logs} />;
}
