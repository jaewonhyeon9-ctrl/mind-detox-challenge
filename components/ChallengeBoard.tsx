"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { supabase, type Participant, type LogRow } from "@/lib/supabase";
import { buildDays, todayInBerlin } from "@/lib/challenge-config";
import InstallApp from "@/components/InstallApp";
import ManageParticipants from "@/components/ManageParticipants";
import Tutorial from "@/components/Tutorial";

type View = "heute" | "uebersicht";

export default function ChallengeBoard({
  initialParticipants,
  initialLogs,
}: {
  initialParticipants: Participant[];
  initialLogs: LogRow[];
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [logs, setLogs] = useState(initialLogs);

  const removeLogsForParticipant = (participantId: number) => {
    setLogs((prev) => prev.filter((l) => l.participant_id !== participantId));
  };
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

  const totalsByParticipant = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of logs) m.set(l.participant_id, (m.get(l.participant_id) ?? 0) + 1);
    return m;
  }, [logs]);

  const totalDays = days.length;

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-4 py-5 pb-24 sm:px-6 sm:py-8">
      <Header
        participants={participants}
        setParticipants={setParticipants}
        onLogsRemoved={removeLogsForParticipant}
      />

      <Tabs view={view} onChange={setView} />

      <div className="breathe-in">
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
      </div>

      {pending ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#15152e]/90 px-4 py-1.5 text-xs text-[#ede9d8]/70 shadow-lg backdrop-blur">
          Speichere…
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <defs>
        <radialGradient id="moonG" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef9e7" />
          <stop offset="60%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="32" r="20" fill="url(#moonG)" />
      <circle cx="36" cy="29" r="19" fill="#0a0a1f" />
      <circle cx="50" cy="14" r="1.2" fill="#fef3c7" opacity="0.85" />
      <circle cx="14" cy="18" r="0.9" fill="#fef3c7" opacity="0.6" />
      <circle cx="54" cy="48" r="0.8" fill="#fef3c7" opacity="0.6" />
    </svg>
  );
}

function Header({
  participants,
  setParticipants,
  onLogsRemoved,
}: {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onLogsRemoved: (participantId: number) => void;
}) {
  return (
    <header className="mb-7 sm:mb-9">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <MoonIcon className="mt-1 h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <div>
            <h1 className="serif text-2xl font-medium tracking-tight text-[#ede9d8] sm:text-4xl">
              Mind Detox Challenge
            </h1>
            <p className="mt-1 text-xs italic text-[#c4b5fd]/70 sm:text-sm">
              Tägliche Meditation — gemeinsam dranbleiben.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full border border-[#fcd34d]/30 bg-[#fcd34d]/[0.06] px-3 py-1 text-[11px] tracking-wide text-[#fcd34d]/90">
            Mai 2026
          </span>
          <ManageParticipants
            participants={participants}
            setParticipants={setParticipants}
            onLogsRemoved={onLogsRemoved}
          />
          <InstallApp />
        </div>
      </div>
    </header>
  );
}

function Tabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="mb-6 flex w-full rounded-full border border-white/5 bg-white/[0.03] p-1 backdrop-blur sm:w-auto sm:inline-flex">
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
        "flex-1 rounded-full px-5 py-2 text-sm tracking-wide transition sm:flex-none " +
        (active
          ? "bg-gradient-to-b from-violet-400/90 to-violet-500/90 text-white shadow-[0_4px_20px_-6px_rgba(167,139,250,0.6)]"
          : "text-[#ede9d8]/55 hover:text-[#ede9d8]/85")
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
      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-center backdrop-blur">
        <p className="serif text-xl text-[#ede9d8]">Heute ist kein Challenge-Tag.</p>
        <p className="mt-2 text-sm text-[#ede9d8]/55">
          ({todayLabel}) — Wechsle zur Übersicht, um andere Tage zu pflegen.
        </p>
      </section>
    );
  }

  const progress = participants.length > 0 ? (checkedCount / participants.length) * 100 : 0;

  return (
    <section>
      <div className="mb-5 rounded-3xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]/60">
              Heute
            </p>
            <p className="serif mt-1 text-xl text-[#ede9d8] sm:text-2xl">
              {todayLabel}
            </p>
          </div>
          <p className="text-right text-xs text-[#ede9d8]/60">
            <span className="serif text-2xl text-[#ede9d8]">{checkedCount}</span>
            <span className="text-[#ede9d8]/40"> / {participants.length}</span>
            <br />
            meditiert
          </p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#a78bfa] via-[#86c099] to-[#fcd34d] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
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
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition backdrop-blur " +
                  (checked
                    ? "border-[#86c099]/30 bg-[#86c099]/[0.08] shadow-[0_2px_20px_-12px_rgba(134,192,153,0.6)]"
                    : "border-white/8 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]")
                }
              >
                <span className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition " +
                      (checked
                        ? "bg-[#86c099] text-[#0a2014] shadow-[0_0_18px_-2px_rgba(134,192,153,0.7)]"
                        : "border border-white/15 text-[#ede9d8]/30")
                    }
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <span className="text-[15px] font-medium text-[#ede9d8]/95">
                    {p.name}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] tracking-wide text-[#ede9d8]/40">
                  {total}
                  <span className="text-[#ede9d8]/25">/{totalDays}</span>
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
  const topRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const todayThRef = useRef<HTMLTableCellElement | null>(null);
  const [innerWidth, setInnerWidth] = useState(0);
  const isSyncing = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const table = tableRef.current?.querySelector("table");
      if (table) setInnerWidth(table.scrollWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (tableRef.current) ro.observe(tableRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [participants.length, days.length]);

  useEffect(() => {
    const container = tableRef.current;
    const target = todayThRef.current;
    if (!container || !target) return;
    const cellLeft = target.offsetLeft;
    const sidebar = 110;
    container.scrollLeft = Math.max(0, cellLeft - sidebar - 40);
  }, []);

  const onTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (tableRef.current) tableRef.current.scrollLeft = e.currentTarget.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const onTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (topRef.current) topRef.current.scrollLeft = e.currentTarget.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const surfaceBg = "bg-[#0d0d24]/80";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur">
      {/* Top scrollbar (mirrors the table) */}
      <div
        ref={topRef}
        onScroll={onTopScroll}
        className="soft-scroll overflow-x-auto"
        aria-hidden="true"
      >
        <div style={{ width: `${innerWidth}px`, height: "1px" }} />
      </div>

      {/* Main table — own vertical scroll so the thead row (date headers) can stick */}
      <div
        ref={tableRef}
        onScroll={onTableScroll}
        className="soft-scroll max-h-[calc(100dvh-200px)] overflow-auto"
      >
        <table className="min-w-full border-collapse text-sm">
          <thead className={`sticky top-0 z-10 ${surfaceBg} backdrop-blur`}>
            <tr>
              <th
                className={`sticky left-0 z-20 min-w-[110px] ${surfaceBg} px-2 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#c4b5fd]/60 sm:min-w-[150px] sm:px-4 sm:text-xs`}
              >
                Teilnehmer
              </th>
              {days.map((d) => (
                <th
                  key={d.iso}
                  ref={d.iso === today ? todayThRef : undefined}
                  className={
                    "px-0.5 py-2 text-center text-xs font-medium " +
                    (d.iso === today
                      ? "text-[#a78bfa]"
                      : "text-[#ede9d8]/50")
                  }
                  title={`${d.weekday} ${d.day}.${d.isWorkshop ? " Workshop" : ""}`}
                >
                  <div className="serif text-base leading-tight text-[#ede9d8]/90">
                    {d.day}
                  </div>
                  <div className="text-[10px] uppercase opacity-60">
                    {d.weekday}
                  </div>
                  {d.isWorkshop ? (
                    <div className="text-[9px] uppercase tracking-wider text-[#fcd34d]/85">
                      WS
                    </div>
                  ) : null}
                </th>
              ))}
              <th
                className={`px-2 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#c4b5fd]/60 sm:px-3`}
              >
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
                    className={`sticky left-0 z-10 ${surfaceBg} px-2 py-1 text-left text-xs font-normal text-[#ede9d8]/90 sm:px-4 sm:py-1.5 sm:text-sm`}
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
                            "m-0.5 h-9 w-9 rounded-lg text-base transition sm:h-7 sm:w-7 sm:text-sm " +
                            (checked
                              ? "bg-[#86c099] text-[#0a2014] shadow-[0_0_14px_-3px_rgba(134,192,153,0.7)]"
                              : isToday
                                ? "bg-[#a78bfa]/20 ring-1 ring-[#a78bfa]/50 hover:bg-[#a78bfa]/30"
                                : "bg-white/[0.04] hover:bg-white/10")
                          }
                          aria-label={`${p.name} ${d.iso}`}
                        >
                          {checked ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-right text-xs text-[#ede9d8]/50 sm:px-3 sm:py-1.5">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-3 text-center">
      <p className="serif text-xs italic tracking-wide text-[#ede9d8]/30">
        ein Atemzug nach dem anderen
      </p>
      <Tutorial />
    </footer>
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
