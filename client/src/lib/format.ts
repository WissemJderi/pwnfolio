import type { Category, Difficulty } from "../api/types";

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const CATEGORY_LABELS: Record<Category, string> = {
  web: "Web",
  pwn: "Pwn",
  crypto: "Crypto",
  forensics: "Forensics",
  osint: "OSINT",
  misc: "Misc",
};

export const CATEGORY_BADGE: Record<Category, string> = {
  web: "bg-sky-500/15 text-sky-300",
  pwn: "bg-red-500/15 text-red-300",
  crypto: "bg-amber-500/15 text-amber-300",
  forensics: "bg-violet-500/15 text-violet-300",
  osint: "bg-emerald-500/15 text-emerald-300",
  misc: "bg-slate-500/15 text-slate-300",
};

export const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  hard: "bg-orange-500/15 text-orange-300",
  insane: "bg-red-500/15 text-red-300",
};

export const getAuthorId = (writeup: {
  author: unknown;
}): string | undefined =>
  typeof writeup.author === "string"
    ? writeup.author
    : (writeup.author as { _id?: string })?._id;
