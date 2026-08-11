import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { api } from "../api/client";
import type { UserCard } from "../api/types";
import { UserHover, UserHoverCardProvider } from "./UserHoverCard";

vi.mock("../api/client", () => ({ api: vi.fn() }));

const card: UserCard = {
  username: "ghost",
  bio: "just an operator",
  interests: ["web", "pwn"],
  createdAt: "2024-01-01T00:00:00Z",
  stats: { writeups: 4, likes: 12, comments: 3, views: 400 },
};

const renderWithCard = () =>
  render(
    <MemoryRouter>
      <UserHoverCardProvider>
        <UserHover username="ghost">
          <span>@ghost</span>
        </UserHover>
      </UserHoverCardProvider>
    </MemoryRouter>,
  );

const openCard = (el: HTMLElement) =>
  act(async () => {
    fireEvent.mouseEnter(el);
    await new Promise((resolve) => setTimeout(resolve, 350));
  });

const closeCard = async (el: HTMLElement) => {
  await act(async () => {
    fireEvent.mouseLeave(el);
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
};

beforeEach(() => {
  vi.mocked(api).mockResolvedValue(card as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("UserHoverCard", () => {
  it("shows the card after hover intent and fetches the profile", async () => {
    renderWithCard();
    await openCard(screen.getByText("@ghost"));

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("@ghost");
    expect(dialog.textContent).toContain("just an operator");
    expect(dialog.textContent).toContain("4");
    expect(vi.mocked(api)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/users/ghost/card");
  });

  it("does not fetch when leaving before the intent delay", async () => {
    renderWithCard();
    const el = screen.getByText("@ghost");

    await act(async () => {
      fireEvent.mouseEnter(el);
      await new Promise((resolve) => setTimeout(resolve, 100));
      fireEvent.mouseLeave(el);
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(vi.mocked(api)).not.toHaveBeenCalled();
  });

  it("caches the profile so a second hover does not refetch", async () => {
    renderWithCard();
    const el = screen.getByText("@ghost");
    await openCard(el);
    expect(screen.getByRole("dialog")).toBeTruthy();

    await closeCard(el);
    expect(screen.queryByRole("dialog")).toBeNull();

    await openCard(el);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(vi.mocked(api)).toHaveBeenCalledTimes(1);
  });

  it("opens immediately on focus and closes on blur", async () => {
    renderWithCard();
    const el = screen.getByText("@ghost");

    await act(async () => {
      fireEvent.focus(el);
    });
    expect(screen.getByRole("dialog")).toBeTruthy();

    await act(async () => {
      fireEvent.blur(el);
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("links to the full profile from the card", async () => {
    renderWithCard();
    await openCard(screen.getByText("@ghost"));

    const dialog = screen.getByRole("dialog");
    const link = dialog.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/users/ghost");
  });
});