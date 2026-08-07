import { z } from "zod";

const CATEGORIES = ["web", "pwn", "crypto", "forensics", "osint", "misc"] as const;
const DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;
const STATUSES = ["draft", "published"] as const;

export const registerSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("email must be a valid email address")
    .max(254),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(72, "password must be at most 72 characters"),
});

export const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("email must be a valid email address")
    .max(254),
  password: z.string().min(1, "password is required").max(72),
});

export const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1, "current password is required").max(72),
  newPassword: z
    .string()
    .min(8, "new password must be between 8 and 72 characters")
    .max(72, "new password must be between 8 and 72 characters"),
});

const writeupField = {
  title: z.string().trim().min(1, "title is required").max(150),
  category: z.enum(CATEGORIES, "invalid category"),
  difficulty: z.enum(DIFFICULTIES, "invalid difficulty").optional(),
  platform: z.string().trim().max(60, "platform is too long").optional(),
  tags: z
    .array(z.string().trim().max(30, "tag is too long"))
    .max(20)
    .default([]),
  sections: z.object({
    recon: z.string().max(10000),
    approach: z.string().max(10000),
    exploitChain: z.string().max(10000),
    takeaway: z.string().max(10000),
  }),
  cveRefs: z.array(z.string().trim().max(100)).max(10).default([]),
};

export const createWriteupSchema = z.strictObject({
  ...writeupField,
  status: z.enum(STATUSES, "status must be draft or published").optional(),
});

export const updateWriteupSchema = z
  .strictObject({
    ...writeupField,
    status: z.enum(STATUSES, "status must be draft or published").optional(),
  })
  .partial();

export const updateProfileSchema = z.strictObject({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,24}$/, "username must be 3–24 characters (a-z, 0-9, _ , -)")
    .optional(),
  bio: z.string().max(300).optional(),
  interests: z.array(z.string().trim().toLowerCase().max(30)).max(20).optional(),
  links: z
    .object({
      github: z.string().trim().max(120).optional(),
      medium: z.string().trim().max(120).optional(),
      website: z.string().trim().max(120).optional(),
      discord: z.string().trim().max(120).optional(),
      x: z.string().trim().max(120).optional(),
      htb: z.string().trim().max(120).optional(),
      tryhackme: z.string().trim().max(120).optional(),
    })
    .optional(),
});