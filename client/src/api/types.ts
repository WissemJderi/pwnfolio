export type Category = "web" | "pwn" | "crypto" | "forensics" | "osint" | "misc";
export type Difficulty = "easy" | "medium" | "hard" | "insane";
export type WriteupStatus = "draft" | "published";

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthorRef {
  _id: string;
  username: string;
}

export interface WriteupSections {
  recon: string;
  approach: string;
  exploitChain: string;
  takeaway: string;
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
  status: WriteupStatus;
  author: AuthorRef | string;
  createdAt: string;
  updatedAt: string;
  likesCount?: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  commentCount?: number;
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
    createdAt: string;
  };
  writeups: Writeup[];
}
