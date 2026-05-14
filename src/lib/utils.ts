import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNaira = (kobo: number | string | undefined | null): string => {
  if (kobo == null) return "₦0";
  const n = Number(kobo) / 100;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
};

export const formatNairaFull = (kobo: number | string | undefined | null): string => {
  if (kobo == null) return "₦0";
  const n = Number(kobo) / 100;
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Activity / notification rows: "Today" + time if calendar day is today, else date + time. */
export const formatActivityTimestamp = (iso: string | Date | undefined | null): string => {
  if (iso == null) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today · ${timeStr}`;
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${dateStr} · ${timeStr}`;
};

/** Revenue / returns chart x-axis: show only the unit relevant to the selected period. */
export type ChartAxisPeriod = "hourly" | "daily" | "monthly" | "yearly";

export const formatChartAxisLabel = (label: string, period: ChartAxisPeriod): string => {
  const t = label.trim();
  if (!t) return "";

  const toDateFromParts = (y: number, m: number, d: number, h?: number, min?: number) => {
    const dt = new Date(y, m - 1, d, h ?? 0, min ?? 0, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  if (period === "yearly") {
    const y = Number(t.slice(0, 4));
    if (!Number.isNaN(y) && y >= 1900 && y <= 2200) return String(y);
    const m = t.match(/^(\d{4})/);
    return m ? m[1] : t;
  }

  if (period === "monthly") {
    const m = t.match(/^(\d{4})-(\d{1,2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const dt = toDateFromParts(y, mo, 1);
      if (dt) return dt.toLocaleString(undefined, { month: "short" });
    }
    return t;
  }

  if (period === "daily") {
    const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const dt = toDateFromParts(y, mo, d);
      if (dt) return String(dt.getDate());
    }
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return String(d.getDate());
    return t;
  }

  // hourly — time only
  let parsed: Date | null = null;
  if (/^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}$/.test(t)) {
    const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{1,2})$/);
    if (m) parsed = toDateFromParts(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]));
  } else if (/^\d{4}-\d{1,2}-\d{1,2}T/.test(t)) {
    parsed = new Date(t);
  } else {
    parsed = new Date(t);
    if (Number.isNaN(parsed.getTime())) parsed = null;
  }

  if (parsed && !Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const parts = t.split("-");
  if (parts.length >= 4) {
    const h = Number(parts[3]);
    if (!Number.isNaN(h)) return `${h}:00`;
  }
  return t;
};
