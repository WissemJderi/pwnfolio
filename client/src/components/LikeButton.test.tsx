import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../api/client";
import { AuthProvider } from "../context/AuthContext";
import { LikeButton, type LikeState } from "./LikeButton";

vi.mock("../api/client", () => ({
  api: vi.fn(),
  setAccessToken: vi.fn(),
}));

const USER = JSON.stringify({
  user: { id: "u1", email: "a@b.c", username: "wissem" },
});

const renderButton = ({
  likesCount = 3,
  isLikedByMe = false,
  onChanged,
  authed = true,
}: {
  likesCount?: number;
  isLikedByMe?: boolean;
  onChanged?: (next: LikeState) => void;
  authed?: boolean;
} = {}) => {
  if (authed) localStorage.setItem("pwnfolio:auth", USER);
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <LikeButton
                writeupId="abc"
                likesCount={likesCount}
                isLikedByMe={isLikedByMe}
                onChanged={onChanged}
              />
            }
          />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

const mockLike = (impl: (path: string) => Promise<unknown>) => {
  vi.mocked(api).mockImplementation((path: string) => {
    if (path === "/api/auth/refresh") return Promise.resolve({ accessToken: "t" });
    return impl(path);
  });
};

beforeEach(() => {
  localStorage.clear();
  mockLike(() => Promise.resolve({ message: "Liked" }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LikeButton", () => {
  it("updates optimistically and syncs via onChanged", async () => {
    let changed: LikeState | null = null;
    let resolveLike!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveLike = r;
    });
    mockLike((path) =>
      path === "/api/writeups/abc/like"
        ? pending
        : Promise.resolve({ message: "Liked" }),
    );

    renderButton({ onChanged: (next) => (changed = next) });

    fireEvent.click(screen.getByTitle("like"));
    expect(screen.getByTitle("unlike")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();

    resolveLike({ message: "Liked" });
    await waitFor(() => expect(changed).toEqual({ isLikedByMe: true, likesCount: 4 }));
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/writeups/abc/like", {
      method: "POST",
    });
  });

  it("rolls back when the request fails", async () => {
    mockLike((path) =>
      path === "/api/writeups/abc/like"
        ? Promise.reject(new Error("boom"))
        : Promise.resolve({ message: "Liked" }),
    );

    renderButton();
    fireEvent.click(screen.getByTitle("like"));

    await waitFor(() => expect(screen.getByTitle("like")).toBeTruthy());
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders the liked state when isLikedByMe is true", () => {
    renderButton({ isLikedByMe: true });
    expect(screen.getByTitle("unlike")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("redirects to login when unauthenticated", async () => {
    renderButton({ authed: false });
    fireEvent.click(screen.getByTitle("like"));
    await waitFor(() => expect(screen.getByText("login page")).toBeTruthy());
    expect(vi.mocked(api)).not.toHaveBeenCalledWith(
      "/api/writeups/abc/like",
      expect.anything(),
    );
  });

  it("ignores clicks while a request is in flight", async () => {
    let resolveLike!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveLike = r;
    });
    mockLike((path) =>
      path === "/api/writeups/abc/like"
        ? pending
        : Promise.resolve({ message: "Liked" }),
    );

    renderButton();
    fireEvent.click(screen.getByTitle("like"));
    fireEvent.click(screen.getByTitle("unlike"));

    await waitFor(() => expect(screen.getByTitle("unlike")).toBeTruthy());
    const likeCalls = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/writeups/abc/like");
    expect(likeCalls).toHaveLength(1);

    resolveLike({ message: "Liked" });
    await waitFor(() => expect(screen.getByText("4")).toBeTruthy());
  });
});
