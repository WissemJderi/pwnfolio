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
  web: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  pwn: "border-blood-400/40 bg-blood-400/10 text-blood-300",
  crypto: "border-gold-400/40 bg-gold-400/10 text-gold-300",
  forensics: "border-vio-400/40 bg-vio-400/10 text-vio-300",
  osint: "border-neon-500/40 bg-neon-500/10 text-neon-400",
  misc: "border-line-700 bg-core-700/60 text-ink-400",
};

export const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "border-neon-500/40 bg-neon-500/10 text-neon-400",
  medium: "border-gold-400/40 bg-gold-400/10 text-gold-300",
  hard: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  insane: "border-blood-400/40 bg-blood-400/10 text-blood-300",
};

export const getAuthorId = (writeup: {
  author: unknown;
}): string | undefined =>
  typeof writeup.author === "string"
    ? writeup.author
    : (writeup.author as { _id?: string })?._id;
