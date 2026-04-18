import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatValue = (num: number) => {
  if (num >= 100000) return `₹${(num/100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num/1000).toFixed(1)}K`;
  return `₹${num}`;
};

export const parseDealValue = (val: string | null | undefined) => {
  if (!val) return 0;
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export function formatFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric",
  }).format(d);
}

export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  }).format(d);
}
