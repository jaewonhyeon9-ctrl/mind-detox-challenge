export const CHALLENGE = {
  name: "Mind Detox Challenge",
  startDate: "2026-05-02",
  endDate: "2026-05-31",
  skipDates: ["2026-05-01", "2026-05-26"] as string[],
  workshopDates: ["2026-05-02", "2026-05-16", "2026-05-30"] as string[],
  timeZone: "Europe/Berlin",
};

export type ChallengeDay = {
  iso: string;
  day: number;
  weekday: string;
  isWorkshop: boolean;
};

const WEEKDAY_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function buildDays(): ChallengeDay[] {
  const days: ChallengeDay[] = [];
  const start = new Date(`${CHALLENGE.startDate}T00:00:00Z`);
  const end = new Date(`${CHALLENGE.endDate}T00:00:00Z`);
  const skip = new Set(CHALLENGE.skipDates);
  const workshop = new Set(CHALLENGE.workshopDates);

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (skip.has(iso)) continue;
    days.push({
      iso,
      day: d.getUTCDate(),
      weekday: WEEKDAY_DE[d.getUTCDay()],
      isWorkshop: workshop.has(iso),
    });
  }
  return days;
}

export function todayInBerlin(): string {
  const now = new Date();
  const berlin = new Date(
    now.toLocaleString("en-US", { timeZone: CHALLENGE.timeZone }),
  );
  const y = berlin.getFullYear();
  const m = String(berlin.getMonth() + 1).padStart(2, "0");
  const d = String(berlin.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
