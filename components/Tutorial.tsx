"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mdc:tutorial:v1";

type Slide = {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  note?: string;
};

const SLIDES: Slide[] = [
  {
    icon: <MoonGlyph />,
    title: "Willkommen",
    body: (
      <>
        Diese Webapp begleitet uns durch die <em>Mind Detox Challenge</em> —
        eine gemeinsame tägliche Meditationspraxis im Mai 2026.
      </>
    ),
    note: "Ein Atemzug nach dem anderen.",
  },
  {
    icon: <CheckGlyph />,
    title: "Tägliche Praxis",
    body: (
      <>
        Hast du heute meditiert? Tippe auf deine Karte in der{" "}
        <b>Heute</b>-Ansicht — sie leuchtet sanft grün auf. Der Balken oben
        zeigt, wie viele von uns heute schon dabei sind.
      </>
    ),
    note: "Auch vergangene Tage kannst du in der „Übersicht“ nachtragen.",
  },
  {
    icon: <CalendarGlyph />,
    title: "Übersicht",
    body: (
      <>
        Im Reiter <b>Übersicht</b> siehst du den ganzen Monat als Raster:
        Zeilen sind Teilnehmer, Spalten sind Tage. Tippe ein Feld, um es ein-
        oder auszuschalten — auch im Nachhinein.
      </>
    ),
    note: "Workshop-Tage (Sa) sind golden markiert.",
  },
  {
    icon: <GearGlyph />,
    title: "Werkzeuge",
    body: (
      <ul className="space-y-2 text-left text-[#ede9d8]/85">
        <li>
          <b className="text-[#c4b5fd]">⚙ Verwalten</b> — Teilnehmer
          hinzufügen, umbenennen oder entfernen.
        </li>
        <li>
          <b className="text-[#c4b5fd]">⬇ App installieren</b> — Auf dem
          Handy wie eine echte App speichern, mit eigenem Symbol.
        </li>
      </ul>
    ),
  },
  {
    icon: <LeafGlyph />,
    title: "Atme.",
    body: (
      <>
        Du bist bereit. Wir freuen uns, mit dir gemeinsam zu üben.
      </>
    ),
    note: "Auf eine ruhige Praxis.",
  },
];

export default function Tutorial() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // private mode etc — silently ignore
    }
  }, []);

  function close() {
    setOpen(false);
    setI(0);
    try {
      window.localStorage.setItem(STORAGE_KEY, "seen");
    } catch {
      // ignore
    }
  }

  function next() {
    if (i < SLIDES.length - 1) setI(i + 1);
    else close();
  }

  function prev() {
    if (i > 0) setI(i - 1);
  }

  function show() {
    setI(0);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={show}
        className="text-[11px] uppercase tracking-[0.2em] text-[#ede9d8]/40 transition hover:text-[#c4b5fd]/80"
      >
        Anleitung anzeigen
      </button>
      {open ? (
        <Modal
          slide={SLIDES[i]}
          index={i}
          total={SLIDES.length}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function Modal({
  slide,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  slide: Slide;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // ESC + arrow keys
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/8 bg-[#15152e]/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 px-5 pt-5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, idx) => (
              <span
                key={idx}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (idx === index
                    ? "w-6 bg-[#c4b5fd]"
                    : "w-1.5 bg-white/15")
                }
              />
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-full p-1 text-[#ede9d8]/45 hover:bg-white/8 hover:text-[#ede9d8]/80"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-7 pb-2 pt-7 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#3d2b6e] via-[#1e1240] to-[#0a0a1f] shadow-[0_8px_30px_-8px_rgba(167,139,250,0.4)] ring-1 ring-[#c4b5fd]/20">
            {slide.icon}
          </div>
          <h2 className="serif text-2xl text-[#ede9d8]">{slide.title}</h2>
          <div className="mx-auto mt-3 max-w-[28rem] text-sm leading-relaxed text-[#ede9d8]/80">
            {slide.body}
          </div>
          {slide.note ? (
            <p className="mt-4 text-xs italic text-[#c4b5fd]/65">
              {slide.note}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="rounded-full px-4 py-2 text-sm tracking-wide text-[#ede9d8]/55 transition hover:text-[#ede9d8]/85 disabled:opacity-30"
          >
            Zurück
          </button>
          {!isLast ? (
            <button
              onClick={onClose}
              className="text-xs text-[#ede9d8]/35 hover:text-[#ede9d8]/60"
            >
              Überspringen
            </button>
          ) : null}
          <button
            onClick={onNext}
            className="rounded-full bg-gradient-to-b from-[#a78bfa]/95 to-[#8b5cf6]/95 px-6 py-2.5 text-sm font-medium tracking-wide text-white shadow-[0_4px_20px_-6px_rgba(167,139,250,0.6)] transition hover:from-[#a78bfa] hover:to-[#8b5cf6]"
          >
            {isLast ? "Loslegen" : "Weiter"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- glyphs ---------- */

function MoonGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10">
      <defs>
        <radialGradient id="tut-moon" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fef9e7" />
          <stop offset="60%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="32" r="20" fill="url(#tut-moon)" />
      <circle cx="36" cy="29" r="19" fill="#0a0a1f" />
      <circle cx="50" cy="14" r="1.2" fill="#fef3c7" opacity="0.85" />
      <circle cx="52" cy="48" r="1" fill="#fef3c7" opacity="0.6" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10">
      <circle cx="32" cy="32" r="22" fill="#86c099" opacity="0.18" />
      <circle cx="32" cy="32" r="14" fill="#86c099" />
      <path
        d="M25 32 L30 37 L40 26"
        fill="none"
        stroke="#0a2014"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10"
      stroke="#c4b5fd"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="12" y="16" width="40" height="36" rx="5" />
      <path d="M22 10 V20 M42 10 V20 M12 28 H52" />
      <circle cx="32" cy="40" r="3" fill="#fcd34d" stroke="none" />
    </svg>
  );
}

function GearGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10"
      stroke="#c4b5fd"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="32" cy="32" r="6" fill="#c4b5fd" stroke="none" />
      <path d="M32 10 V18 M32 46 V54 M10 32 H18 M46 32 H54 M16 16 L22 22 M42 42 L48 48 M48 16 L42 22 M22 42 L16 48" />
      <circle cx="32" cy="32" r="14" />
    </svg>
  );
}

function LeafGlyph() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10"
      fill="none"
      stroke="#86c099"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M14 50 C14 24, 38 14, 52 14 C52 32, 42 50, 18 52 Z"
        fill="#86c099"
        opacity="0.18"
      />
      <path d="M14 50 C14 24, 38 14, 52 14 C52 32, 42 50, 18 52 Z" />
      <path d="M16 50 L46 20" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
