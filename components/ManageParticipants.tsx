"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type Participant } from "@/lib/supabase";

export default function ManageParticipants({
  participants,
  setParticipants,
  onLogsRemoved,
}: {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onLogsRemoved: (participantId: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Teilnehmer verwalten"
        className="flex items-center gap-1.5 rounded-full border border-[#c4b5fd]/25 bg-[#c4b5fd]/[0.06] px-3 py-1.5 text-xs font-medium text-[#c4b5fd]/90 transition hover:bg-[#c4b5fd]/[0.12] active:bg-[#c4b5fd]/15"
      >
        <GearIcon className="h-3.5 w-3.5" />
        <span>Verwalten</span>
      </button>
      {open ? (
        <ManageModal
          participants={participants}
          setParticipants={setParticipants}
          onLogsRemoved={onLogsRemoved}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ManageModal({
  participants,
  setParticipants,
  onLogsRemoved,
  onClose,
}: {
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  onLogsRemoved: (participantId: number) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError(`„${name}" existiert bereits.`);
      return;
    }
    setError(null);
    setBusy("add");
    const nextOrder =
      participants.length > 0
        ? Math.max(...participants.map((p) => p.display_order)) + 1
        : 0;
    const { data, error } = await supabase
      .from("mdc_participants")
      .insert({ name, display_order: nextOrder })
      .select("id, name, display_order")
      .single();
    setBusy(null);
    if (error || !data) {
      setError(error?.message ?? "Fehler beim Hinzufügen.");
      return;
    }
    setParticipants((prev) =>
      [...prev, data as Participant].sort(
        (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name),
      ),
    );
    setNewName("");
  }

  function startEdit(p: Participant) {
    setEditingId(p.id);
    setEditName(p.name);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(p: Participant) {
    const name = editName.trim();
    if (!name) return;
    if (name === p.name) {
      cancelEdit();
      return;
    }
    if (
      participants.some(
        (other) =>
          other.id !== p.id && other.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError(`„${name}" existiert bereits.`);
      return;
    }
    setError(null);
    setBusy(`edit:${p.id}`);
    const { error } = await supabase
      .from("mdc_participants")
      .update({ name })
      .eq("id", p.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setParticipants((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, name } : x)),
    );
    cancelEdit();
  }

  async function handleDelete(p: Participant) {
    const ok = window.confirm(
      `„${p.name}" wirklich entfernen?\n\nAlle Einträge dieser Person werden gelöscht.`,
    );
    if (!ok) return;
    setError(null);
    setBusy(`delete:${p.id}`);
    const { error } = await supabase
      .from("mdc_participants")
      .delete()
      .eq("id", p.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setParticipants((prev) => prev.filter((x) => x.id !== p.id));
    onLogsRemoved(p.id);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl border border-white/8 bg-[#15152e]/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div>
            <h2 className="serif text-xl text-[#ede9d8]">
              Teilnehmer verwalten
            </h2>
            <p className="mt-1 text-xs italic text-[#c4b5fd]/65">
              Hinzufügen, umbenennen oder entfernen.
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

        {/* Add form */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="Name eingeben…"
              className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-[#ede9d8] placeholder:text-[#ede9d8]/30 focus:border-[#c4b5fd]/40 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || busy === "add"}
              className="rounded-full bg-gradient-to-b from-[#a78bfa]/95 to-[#8b5cf6]/95 px-4 py-2 text-sm font-medium text-white shadow-[0_4px_20px_-6px_rgba(167,139,250,0.6)] transition hover:from-[#a78bfa] hover:to-[#8b5cf6] disabled:opacity-40"
            >
              {busy === "add" ? "…" : "Hinzufügen"}
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-rose-300">{error}</p>
          ) : null}
        </div>

        {/* List */}
        <div className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-[#c4b5fd]/50">
            {participants.length} Teilnehmer
          </p>
          <ul className="space-y-1">
            {participants.map((p) => {
              const isEditing = editingId === p.id;
              const isBusy = busy === `edit:${p.id}` || busy === `delete:${p.id}`;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 hover:bg-white/[0.03]"
                >
                  {isEditing ? (
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(p);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-[#ede9d8] focus:border-[#c4b5fd]/50 focus:outline-none"
                      />
                      <button
                        onClick={() => saveEdit(p)}
                        disabled={isBusy || !editName.trim()}
                        className="rounded-full bg-[#86c099]/20 px-3 py-1.5 text-xs font-medium text-[#86c099] hover:bg-[#86c099]/30 disabled:opacity-40"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full px-2.5 py-1.5 text-xs text-[#ede9d8]/50 hover:bg-white/5 hover:text-[#ede9d8]/80"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm text-[#ede9d8]/95">
                        {p.name}
                      </span>
                      <button
                        onClick={() => startEdit(p)}
                        disabled={isBusy}
                        aria-label={`${p.name} bearbeiten`}
                        className="rounded-full p-2 text-[#c4b5fd]/70 transition hover:bg-[#c4b5fd]/10 hover:text-[#c4b5fd] disabled:opacity-40"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={isBusy}
                        aria-label={`${p.name} entfernen`}
                        className="rounded-full p-2 text-rose-300/70 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-white/5 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-white/[0.04] py-2.5 text-sm tracking-wide text-[#ede9d8]/80 transition hover:bg-white/[0.08]"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}

function GearIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
