// Semua tanggal memakai zona Asia/Jakarta (WIB)
export const TZ = "Asia/Jakarta";
export const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function todayWIB() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function toWIB(iso) {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}:${g("second")}`;
}

export function parse(ymd) {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fmt(dt) {
  return dt.toISOString().slice(0, 10);
}

export function addDays(ymd, n) {
  const d = parse(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function weekStart(ymd) {
  const d = parse(ymd);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return fmt(d);
}

export function monthStart(ymd) {
  return ymd.slice(0, 7) + "-01";
}

export function monthEnd(ymd) {
  const d = parse(monthStart(ymd));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return fmt(d);
}

export function rangeFor(view, ymd) {
  if (view === "day") return [ymd, ymd];
  if (view === "month") return [monthStart(ymd), monthEnd(ymd)];
  const s = weekStart(ymd);
  return [s, addDays(s, 6)];
}

export function shiftFor(view, ymd, dir) {
  if (view === "day") return addDays(ymd, dir);
  if (view === "month") {
    const d = parse(monthStart(ymd));
    d.setUTCMonth(d.getUTCMonth() + dir);
    return fmt(d);
  }
  return addDays(weekStart(ymd), dir * 7);
}

export function nice(ymd) {
  const d = parse(ymd);
  return `${d.getUTCDate()} ${BLN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function niceLong(ymd) {
  const d = parse(ymd);
  return `${HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function labelRange(view, a, b) {
  if (view === "day") return niceLong(a);
  if (view === "month") {
    const d = parse(a);
    return `${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return `${nice(a)} – ${nice(b)}`;
}

export function daysBetween(a, b) {
  return Math.round((parse(b) - parse(a)) / 86400000);
}
