import type { z } from "zod";
import type {
  createWriteupSchema,
  updateProfileSchema,
} from "@shared/schemas";

export type Category = z.infer<typeof createWriteupSchema>["category"];
export type Difficulty = NonNullable<
  z.infer<typeof createWriteupSchema>["difficulty"]
>;
export type WriteupStatus = NonNullable<
  z.infer<typeof createWriteupSchema>["status"]
>;
export type WriteupSections = z.infer<typeof createWriteupSchema>["sections"];
export type ChainStep = z.infer<typeof createWriteupSchema>["chainSteps"][number];

export type ProfileLinks = NonNullable<
  z.infer<typeof updateProfileSchema>["links"]
>;

export interface User {
  id: string;
  email: string;
  username: string;
  links?: ProfileLinks;
}

export interface AuthorRef {
  _id: string;
  username: string;
}

export interface Writeup {
  _id: string;
  title: string;
  category: Category;
  difficulty?: Difficulty;
  platform?: string;
  tags: string[];
  sections: WriteupSections;
  cveRefs: string[];
  chainSteps: ChainStep[];
  status: WriteupStatus;
  views?: number;
  author: AuthorRef | string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  commentCount?: number;
}

export interface FeaturedResponse {
  writeup: (Writeup & { likesCount: number }) | null;
}

export interface RelatedWriteupsResponse {
  writeups: Writeup[];
}

export interface WriteupListResponse {
  writeups: Writeup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CommentWithReplies {
  _id: string;
  content: string;
  author: AuthorRef;
  parent: string | null;
  createdAt: string;
  replies: CommentWithReplies[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PublicProfile {
  user: {
    username: string;
    bio?: string;
    interests?: string[];
    links?: ProfileLinks;
    createdAt: string;
  };
  writeups: Writeup[];
}

export interface UserCard {
  username: string;
  bio?: string;
  interests?: string[];
  links?: ProfileLinks;
  createdAt: string;
  stats: {
    writeups: number;
    likes: number;
    comments: number;
    views: number;
  };
}

export interface StatsBucket {
  name: string;
  count: number;
}

export interface UserStats {
  username: string;
  totals: {
    writeups: number;
    likes: number;
    comments: number;
    saves: number;
    views: number;
  };
  byCategory: StatsBucket[];
  byDifficulty: StatsBucket[];
  byPlatform: StatsBucket[];
  activity: { month: string; count: number }[];
}
