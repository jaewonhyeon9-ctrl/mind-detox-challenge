// Seed Mind Detox Challenge Supabase tables from data/sheet.csv
// Usage: npm run seed
//
// - Parses CSV (multi-line quoted cells supported)
// - Maps each data column to its calendar date using CHALLENGE config
// - Truncates existing mdc_logs/mdc_participants and re-inserts everything

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const CHALLENGE = {
  startDate: "2026-05-02",
  endDate: "2026-05-31",
  skipDates: new Set(["2026-05-01", "2026-05-26"]),
};

function buildDayList() {
  const days = [];
  const start = new Date(`${CHALLENGE.startDate}T00:00:00Z`);
  const end = new Date(`${CHALLENGE.endDate}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (CHALLENGE.skipDates.has(iso)) continue;
    days.push(iso);
  }
  return days;
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeName(raw) {
  return raw.replace(/\s+/g, " ").trim();
}

async function main() {
  const csvPath = path.join(ROOT, "data", "sheet.csv");
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);

  // Skip first 2 metadata rows (aaa / aab — header labels in the sheet)
  const dataRows = rows.slice(2).filter((r) => normalizeName(r[0] ?? ""));
  const days = buildDayList();

  console.log(`Parsed ${dataRows.length} participants, ${days.length} days`);

  if (dataRows.length === 0) {
    console.error("No data rows found in CSV");
    process.exit(1);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Wipe + reinsert participants
  console.log("Truncating existing data…");
  await sb.from("mdc_logs").delete().gte("id", 0);
  await sb.from("mdc_participants").delete().gte("id", 0);

  const participantPayload = dataRows.map((r, idx) => ({
    name: normalizeName(r[0]),
    display_order: idx,
  }));

  console.log("Inserting participants…");
  const { data: inserted, error: pErr } = await sb
    .from("mdc_participants")
    .insert(participantPayload)
    .select("id, name, display_order");
  if (pErr) {
    console.error("Failed inserting participants:", pErr);
    process.exit(1);
  }

  const nameToId = new Map(inserted.map((p) => [p.name, p.id]));

  // 2. Build logs
  const logs = [];
  for (const r of dataRows) {
    const name = normalizeName(r[0]);
    const pid = nameToId.get(name);
    if (!pid) continue;
    for (let col = 0; col < days.length; col++) {
      const cell = (r[col + 1] ?? "").trim().toUpperCase();
      if (cell === "TRUE") {
        logs.push({ participant_id: pid, date: days[col] });
      }
    }
  }

  console.log(`Inserting ${logs.length} log rows…`);
  // Batch in chunks of 500
  for (let i = 0; i < logs.length; i += 500) {
    const chunk = logs.slice(i, i + 500);
    const { error: lErr } = await sb.from("mdc_logs").insert(chunk);
    if (lErr) {
      console.error(`Failed inserting logs chunk at ${i}:`, lErr);
      process.exit(1);
    }
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
