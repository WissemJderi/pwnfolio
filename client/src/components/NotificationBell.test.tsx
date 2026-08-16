import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../api/client";
import { AuthProvider } from "../context/AuthContext";
import { NotificationBell, NotificationsProvider } from "./NotificationBell";
import type { NotificationItem } from "../api/types";

vi.mock("../api/client", () => ({
  api: vi.fn(),
  setAccessToken: vi.fn(),
}));

const USER = JSON.stringify({
  user: { id: "u1", email: "a@b.c", username: "wissem" },
});

const notification = (overrides?: Partial<NotificationItem>): NotificationItem => ({
  _id: "n1",
  recipient: "u1",
  actor: { _id: "u2", username: "ghost" },
  type: "like",
  writeup: { _id: "w1", title: "SQLi in login form" },
  read: false,
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

let unreadCount = 0;

const mockApi = (extra?: (path: string, opts?: RequestInit) => Promise<unknown> | undefined) => {
  vi.mocked(api).mockImplementation((path: string, opts?: RequestInit) => {
    const custom = extra?.(path, opts);
    if (custom !== undefined) return custom;
    if (path === "/api/auth/refresh") return Promise.resolve({ accessToken: "t" });
    if (path === "/api/notifications/unread-count") {
      return Promise.resolve({ count: unreadCount });
    }
    if (path === "/api/notifications?limit=8") {
      return Promise.resolve({
        notifications: [notification()],
        pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
      });
    }
    if (path.startsWith("/api/notifications/") && path.endsWith("/read")) {
      return Promise.resolve({});
    }
    if (path === "/api/notifications/read-all") {
      return Promise.resolve(undefined);
    }
    return Promise.resolve({});
  });
};

const renderBell = () => {
  localStorage.setItem("pwnfolio:auth", USER);
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <NotificationsProvider>
          <Routes>
            <Route path="/" element={<NotificationBell />} />
            <Route path="/writeups/:id" element={<p>writeup page</p>} />
          </Routes>
        </NotificationsProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  localStorage.clear();
  unreadCount = 0;
  mockApi();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("NotificationBell", () => {
  it("renders no badge when there are no unread notifications", async () => {
    renderBell();
    await waitFor(() => expect(vi.mocked(api)).toHaveBeenCalledWith("/api/notifications/unread-count"));
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });

  it("shows the unread count, capped at 9+", async () => {
    unreadCount = 12;
    renderBell();
    await waitFor(() => expect(screen.getByText("9+")).toBeTruthy());
  });

  it("shows the exact count when 9 or fewer", async () => {
    unreadCount = 5;
    renderBell();
    await waitFor(() => expect(screen.getByText("5")).toBeTruthy());
  });

  it("opens the dropdown on click and fetches the list", async () => {
    renderBell();
    fireEvent.click(screen.getByTitle("notifications"));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    expect(screen.getByText("@ghost")).toBeTruthy();
    expect(screen.getByText("SQLi in login form")).toBeTruthy();
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/notifications?limit=8");
  });

  it("marks an item read and navigates to the writeup on click", async () => {
    renderBell();
    fireEvent.click(screen.getByTitle("notifications"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

    fireEvent.click(screen.getByText("SQLi in login form"));

    await waitFor(() => expect(screen.getByText("writeup page")).toBeTruthy());
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/notifications/n1/read", {
      method: "PATCH",
    });
  });

  it("mark all read clears the badge", async () => {
    unreadCount = 3;
    renderBell();
    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());

    fireEvent.click(screen.getByTitle("notifications"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

    unreadCount = 0;
    fireEvent.click(screen.getByText(/mark all read/i));

    await waitFor(() => expect(screen.queryByText("3")).toBeNull());
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/notifications/read-all", {
      method: "PATCH",
    });
  });

  it("polls for the unread count on an interval", async () => {
    vi.useFakeTimers();
    unreadCount = 1;
    renderBell();

    await act(async () => {
      await Promise.resolve();
    });
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/notifications/unread-count");
    const callsBefore = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/notifications/unread-count").length;

    await act(async () => {
      vi.advanceTimersByTime(45_000);
      await Promise.resolve();
    });

    const callsAfter = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/notifications/unread-count").length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });

  it("does not poll while the tab is hidden", async () => {
    vi.useFakeTimers();
    renderBell();

    await act(async () => {
      await Promise.resolve();
    });
    const callsBefore = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/notifications/unread-count").length;

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    await act(async () => {
      vi.advanceTimersByTime(45_000);
      await Promise.resolve();
    });

    const callsAfter = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/notifications/unread-count").length;
    expect(callsAfter).toBe(callsBefore);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });
});
