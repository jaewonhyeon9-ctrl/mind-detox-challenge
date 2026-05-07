"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ reports as Mac — detect via touch
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export default function InstallApp() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS legacy
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setOpen(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isInstalled) return null;

  async function handleClick() {
    // Android/Chrome: native prompt available — try it first
    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") {
          setDeferred(null);
          return;
        }
      } catch {
        // fall through to manual instructions
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="App installieren"
        className="flex items-center gap-1.5 rounded-full border border-[#c4b5fd]/25 bg-[#c4b5fd]/[0.06] px-3 py-1.5 text-xs font-medium text-[#c4b5fd]/90 transition hover:bg-[#c4b5fd]/[0.12] active:bg-[#c4b5fd]/15"
      >
        <DownloadIcon className="h-3.5 w-3.5" />
        <span>App installieren</span>
      </button>
      {open ? (
        <InstallModal platform={platform} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function InstallModal({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/8 bg-[#15152e]/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="serif text-xl text-[#ede9d8]">App installieren</h2>
            <p className="mt-1 text-xs italic text-[#c4b5fd]/65">
              Schneller Zugriff direkt vom Startbildschirm.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="rounded-full p-1 text-[#ede9d8]/50 hover:bg-white/8 hover:text-[#ede9d8]/80"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <PlatformPicker active={platform} />

        <div className="mt-4 space-y-3">
          {platform === "ios" ? <IosSteps /> : null}
          {platform === "android" ? <AndroidSteps /> : null}
          {platform === "desktop" ? <DesktopSteps /> : null}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-gradient-to-b from-[#a78bfa]/95 to-[#8b5cf6]/95 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_24px_-6px_rgba(167,139,250,0.5)] transition hover:from-[#a78bfa] hover:to-[#8b5cf6]"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}

function PlatformPicker({ active }: { active: Platform }) {
  return (
    <div className="flex gap-2">
      <Tag active={active === "ios"} label="iPhone / iPad" />
      <Tag active={active === "android"} label="Android" />
      <Tag active={active === "desktop"} label="Desktop" />
    </div>
  );
}

function Tag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-[11px] tracking-wide " +
        (active
          ? "bg-[#c4b5fd]/15 text-[#c4b5fd] ring-1 ring-[#c4b5fd]/40"
          : "bg-white/[0.04] text-[#ede9d8]/35")
      }
    >
      {label}
    </span>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="serif flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c4b5fd]/15 text-sm text-[#c4b5fd] ring-1 ring-[#c4b5fd]/25">
        {n}
      </div>
      <div className="pt-0.5 text-sm leading-relaxed text-[#ede9d8]/85">
        {children}
      </div>
    </div>
  );
}

function IosSteps() {
  return (
    <>
      <Step n={1}>
        Öffne diese Seite in <b>Safari</b> (nicht in einer anderen App).
      </Step>
      <Step n={2}>
        Tippe unten auf das <b>Teilen-Symbol</b>{" "}
        <span className="inline-block translate-y-0.5">
          <ShareIcon className="inline h-4 w-4" />
        </span>{" "}
        (Quadrat mit Pfeil nach oben).
      </Step>
      <Step n={3}>
        Wähle <b>„Zum Home-Bildschirm“</b>.
      </Step>
      <Step n={4}>
        Bestätige mit <b>„Hinzufügen“</b> oben rechts.
      </Step>
    </>
  );
}

function AndroidSteps() {
  return (
    <>
      <Step n={1}>
        Öffne diese Seite in <b>Chrome</b> (oder einem anderen Chromium-Browser).
      </Step>
      <Step n={2}>
        Tippe oben rechts auf das <b>Drei-Punkte-Menü</b> ⋮.
      </Step>
      <Step n={3}>
        Wähle <b>„App installieren“</b> oder{" "}
        <b>„Zum Startbildschirm hinzufügen“</b>.
      </Step>
      <Step n={4}>
        Bestätige mit <b>„Installieren“</b>. Das App-Symbol erscheint auf
        deinem Startbildschirm.
      </Step>
    </>
  );
}

function DesktopSteps() {
  return (
    <>
      <Step n={1}>
        Öffne diese Seite in <b>Chrome</b>, <b>Edge</b> oder einem anderen
        Chromium-Browser.
      </Step>
      <Step n={2}>
        Klicke in der Adressleiste rechts auf das <b>Installations-Symbol</b>{" "}
        (Monitor mit Pfeil) oder öffne das Menü ⋮ → <b>„App installieren“</b>.
      </Step>
      <Step n={3}>
        Bestätige mit <b>„Installieren“</b>. Die App öffnet sich in einem
        eigenen Fenster.
      </Step>
    </>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

function ShareIcon({ className }: { className?: string }) {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
