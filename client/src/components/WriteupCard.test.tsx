import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WriteupCard } from "./WriteupCard";
import { AuthProvider } from "../context/AuthContext";
import type { Writeup } from "../api/types";

const base: Writeup = {
  _id: "abc123",
  title: "Nibbles walkthrough",
  category: "web",
  difficulty: "easy",
  platform: "hackthebox",
  tags: ["sqli", "lfi"],
  sections: { recon: "some content", approach: "more depth", exploitChain: "x", takeaway: "y" },
  cveRefs: ["CVE-2021-0000"],
  chainSteps: [],
  status: "published",
  views: 12,
  author: { _id: "u1", username: "wissem" },
  createdAt: "2024-06-15T12:00:00Z",
  updatedAt: "2024-06-15T12:00:00Z",
  likesCount: 3,
  commentCount: 1,
};

const renderCard = (writeup: Writeup = base) =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <WriteupCard writeup={writeup} />
      </AuthProvider>
    </MemoryRouter>,
  );

describe("WriteupCard", () => {
  it("renders title, badges, author and meta", () => {
    renderCard();
    expect(screen.getByText("Nibbles walkthrough")).toBeTruthy();
    expect(screen.getByText("Web")).toBeTruthy();
    expect(screen.getByText("easy")).toBeTruthy();
    expect(screen.getByText("hackthebox")).toBeTruthy();
    expect(screen.getByText("@wissem")).toBeTruthy();
    expect(screen.getByText("~1 min")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("links to the writeup and author pages", () => {
    renderCard();
    const writeupLink = screen.getByRole("link", { name: "Nibbles walkthrough" });
    expect(writeupLink.getAttribute("href")).toBe("/writeups/abc123");
  });

  it("shows a draft badge for drafts", () => {
    renderCard({ ...base, status: "draft" });
    expect(screen.getByText("draft")).toBeTruthy();
  });

  it("falls back for unpopulated authors", () => {
    renderCard({ ...base, author: "u1" });
    expect(screen.getByText("unknown author")).toBeTruthy();
  });
});