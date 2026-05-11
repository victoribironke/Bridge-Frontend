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
