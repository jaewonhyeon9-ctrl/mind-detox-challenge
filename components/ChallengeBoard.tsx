"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { supabase, type Participant, type LogRow } from "@/lib/supabase";
import { buildDays, todayInBerlin } from "@/lib/challenge-config";
import InstallApp from "@/components/InstallApp";

type View = "heute" | "uebersicht";

export default function ChallengeBoard({
  initialParticipants,
  initialLogs,
}: {
  initialParticipants: Participant[];
  initialLogs: LogRow[];
}) {
  const [participants] = useState(initialParticipants);
  const [logs, setLogs] = useState(initialLogs);
  const [view, setView] = useState<View>("heute");
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const days = useMemo(() => buildDays(), []);
  const today = todayInBerlin();
  const todayInChallenge = days.some((d) => d.iso === today);

  const logSet = useMemo(() => {
    const s = new Set<string>();
    for (const l of logs) s.add(`${l.participant_id}|${l.date}`);
    return s;
  }, [logs]);

  function isChecked(pid: number, date: string) {
    return logSet.has(`${pid}|${date}`);
  }

  async function toggle(pid: number, date: string) {
    const key = `${pid}|${date}`;
    if (busyKey) return;
    const checked = isChecked(pid, date);
    setBusyKey(key);

    // Optimistic update
    if (checked) {
      setLogs((prev) =>
        prev.filter((l) => !(l.participant_id === pid && l.date === date)),
      );
    } else {
      setLogs((prev) => [...prev, { participant_id: pid, date }]);
    }

    startTransition(async () => {
      try {
        if (checked) {
          await supabase
            .from("mdc_logs")
            .delete()
            .eq("participant_id", pid)
            .eq("date", date);
        } else {
          await supabase
            .from("mdc_logs")
            .insert({ participant_id: pid, date });
        }
      } finally {
        setBusyKey(null);
      }
    });
  }

  // Per-participant total
  const totalsByParticipant = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of logs) m.set(l.participant_id, (m.get(l.participant_id) ?? 0) + 1);
    return m;
  }, [logs]);

  const totalDays = days.length;

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:px-4 sm:py-6">
      <Header />

      <Tabs view={view} onChange={setView} />

      {view === "heute" ? (
        <HeuteView
          participants={participants}
          today={today}
          todayInChallenge={todayInChallenge}
          isChecked={isChecked}
          toggle={toggle}
          busyKey={busyKey}
          totalsByParticipant={totalsByParticipant}
          totalDays={totalDays}
        />
      ) : (
        <UebersichtView
          participants={participants}
          days={days}
          today={today}
          isChecked={isChecked}
          toggle={toggle}
          busyKey={busyKey}
          totalsByParticipant={totalsByParticipant}
        />
      )}

      {pending ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
          Speichere…
        </div>
      ) : null}
    </main>
  );
}

function Header() {
  return (
    <header className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Mind Detox Challenge
          </h1>
          <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
            Tägliche Meditation — gemeinsam dranbleiben.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
            Mai 2026
          </span>
          <InstallApp />
        </div>
      </div>
    </header>
  );
}

function Tabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="mb-5 flex w-full rounded-xl bg-white/5 p-1 sm:w-auto sm:inline-flex">
      <TabButton active={view === "heute"} onClick={() => onChange("heute")}>
        Heute
      </TabButton>
      <TabButton
        active={view === "uebersicht"}
        onClick={() => onChange("uebersicht")}
      >
        Übersicht
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none " +
        (active
          ? "bg-violet-500 text-white shadow"
          : "text-white/70 hover:text-white")
      }
    >
      {children}
    </button>
  );
}

function HeuteView({
  participants,
  today,
  todayInChallenge,
  isChecked,
  toggle,
  busyKey,
  totalsByParticipant,
  totalDays,
}: {
  participants: Participant[];
  today: string;
  todayInChallenge: boolean;
  isChecked: (pid: number, date: string) => boolean;
  toggle: (pid: number, date: string) => void;
  busyKey: string | null;
  totalsByParticipant: Map<number, number>;
  totalDays: number;
}) {
  const todayLabel = formatGermanDate(today);
  const checkedCount = participants.filter((p) => isChecked(p.id, today)).length;

  if (!todayInChallenge) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-lg">Heute ist kein Challenge-Tag.</p>
        <p className="mt-1 text-sm text-white/60">
          ({todayLabel}) — Wechsle zur Übersicht, um andere Tage zu pflegen.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50">Heute</p>
          <p className="text-lg font-semibold">{todayLabel}</p>
        </div>
        <p className="text-sm text-white/70">
          {checkedCount} / {participants.length} meditiert
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {participants.map((p) => {
          const checked = isChecked(p.id, today);
          const key = `${p.id}|${today}`;
          const total = totalsByParticipant.get(p.id) ?? 0;
          return (
            <li key={p.id}>
              <button
                onClick={() => toggle(p.id, today)}
                disabled={busyKey === key}
                className={
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 transition " +
                  (checked
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                }
              >
                <span className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold " +
                      (checked
                        ? "bg-emerald-400 text-emerald-950"
                        : "border border-white/20 text-white/40")
                    }
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </span>
                <span className="text-xs text-white/50">
                  {total}/{totalDays} Tage
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UebersichtView({
  participants,
  days,
  today,
  isChecked,
  toggle,
  busyKey,
  totalsByParticipant,
}: {
  participants: Participant[];
  days: ReturnType<typeof buildDays>;
  today: string;
  isChecked: (pid: number, date: string) => boolean;
  toggle: (pid: number, date: string) => void;
  busyKey: string | null;
  totalsByParticipant: Map<number, number>;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const todayThRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const target = todayThRef.current;
    if (!container || !target) return;
    const cellLeft = target.offsetLeft;
    const sidebar = 110;
    container.scrollLeft = Math.max(0, cellLeft - sidebar - 40);
  }, []);

  return (
    <section
      ref={scrollRef}
      className="overflow-x-auto overflow-y-visible rounded-2xl border border-white/10 bg-white/[0.02]"
    >
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur">
          <tr>
            <th className="sticky left-0 z-20 min-w-[110px] bg-[#0b1120]/95 px-2 py-2 text-left text-xs font-medium text-white/60 sm:min-w-[140px] sm:px-3 sm:text-sm">
              Teilnehmer
            </th>
            {days.map((d) => (
              <th
                key={d.iso}
                ref={d.iso === today ? todayThRef : undefined}
                className={
                  "px-0.5 py-2 text-center text-xs font-medium " +
                  (d.iso === today ? "text-violet-300" : "text-white/50")
                }
                title={`${d.weekday} ${d.day}.${d.isWorkshop ? " Workshop" : ""}`}
              >
                <div className="leading-tight">{d.day}</div>
                <div className="text-[10px] uppercase opacity-60">
                  {d.weekday}
                </div>
                {d.isWorkshop ? (
                  <div className="text-[9px] uppercase tracking-wider text-amber-300">
                    WS
                  </div>
                ) : null}
              </th>
            ))}
            <th className="px-2 py-2 text-right text-xs font-medium text-white/60 sm:px-3">
              Σ
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => {
            const total = totalsByParticipant.get(p.id) ?? 0;
            return (
              <tr key={p.id} className="border-t border-white/5">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[#0b1120]/95 px-2 py-1 text-left text-xs font-normal text-white/90 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  {p.name}
                </th>
                {days.map((d) => {
                  const checked = isChecked(p.id, d.iso);
                  const key = `${p.id}|${d.iso}`;
                  const isToday = d.iso === today;
                  return (
                    <td key={d.iso} className="p-0 text-center">
                      <button
                        onClick={() => toggle(p.id, d.iso)}
                        disabled={busyKey === key}
                        className={
                          "m-0.5 h-9 w-9 rounded-md text-base transition sm:h-7 sm:w-7 sm:text-sm " +
                          (checked
                            ? "bg-emerald-400 text-emerald-950"
                            : isToday
                              ? "bg-violet-500/20 ring-1 ring-violet-400/50 hover:bg-violet-500/30"
                              : "bg-white/[0.04] hover:bg-white/10")
                        }
                        aria-label={`${p.name} ${d.iso}`}
                      >
                        {checked ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-right text-xs text-white/60 sm:px-3 sm:py-1.5">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function formatGermanDate(iso: string) {
  const monthsDe = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  const weekdaysDe = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  const d = new Date(`${iso}T00:00:00Z`);
  return `${weekdaysDe[d.getUTCDay()]}, ${d.getUTCDate()}. ${monthsDe[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
