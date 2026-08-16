import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../api/client";
import { AuthProvider } from "../context/AuthContext";
import { FollowButton } from "./FollowButton";

vi.mock("../api/client", () => ({
  api: vi.fn(),
  setAccessToken: vi.fn(),
}));

const USER = JSON.stringify({
  user: { id: "u1", email: "a@b.c", username: "wissem" },
});

const renderButton = ({
  isFollowedByMe = false,
  onChanged,
  authed = true,
}: {
  isFollowedByMe?: boolean;
  onChanged?: (next: boolean) => void;
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
              <FollowButton
                username="target"
                isFollowedByMe={isFollowedByMe}
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

const mockFollow = (impl: (path: string) => Promise<unknown>) => {
  vi.mocked(api).mockImplementation((path: string) => {
    if (path === "/api/auth/refresh") return Promise.resolve({ accessToken: "t" });
    return impl(path);
  });
};

beforeEach(() => {
  localStorage.clear();
  mockFollow(() => Promise.resolve({ message: "Followed" }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("FollowButton", () => {
  it("updates optimistically and syncs via onChanged", async () => {
    let changed: boolean | null = null;
    let resolveFollow!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveFollow = r;
    });
    mockFollow((path) =>
      path === "/api/users/target/follow"
        ? pending
        : Promise.resolve({ message: "Followed" }),
    );

    renderButton({ onChanged: (next) => (changed = next) });

    fireEvent.click(screen.getByTitle("follow"));
    expect(screen.getByTitle("unfollow")).toBeTruthy();

    resolveFollow({ message: "Followed" });
    await waitFor(() => expect(changed).toBe(true));
    expect(vi.mocked(api)).toHaveBeenCalledWith("/api/users/target/follow", {
      method: "POST",
    });
  });

  it("rolls back when the request fails", async () => {
    mockFollow((path) =>
      path === "/api/users/target/follow"
        ? Promise.reject(new Error("boom"))
        : Promise.resolve({ message: "Followed" }),
    );

    renderButton();
    fireEvent.click(screen.getByTitle("follow"));

    await waitFor(() => expect(screen.getByTitle("follow")).toBeTruthy());
  });

  it("renders the following state when isFollowedByMe is true", () => {
    renderButton({ isFollowedByMe: true });
    expect(screen.getByTitle("unfollow")).toBeTruthy();
  });

  it("redirects to login when unauthenticated", async () => {
    renderButton({ authed: false });
    fireEvent.click(screen.getByTitle("follow"));
    await waitFor(() => expect(screen.getByText("login page")).toBeTruthy());
    expect(vi.mocked(api)).not.toHaveBeenCalledWith(
      "/api/users/target/follow",
      expect.anything(),
    );
  });

  it("ignores clicks while a request is in flight", async () => {
    let resolveFollow!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveFollow = r;
    });
    mockFollow((path) =>
      path === "/api/users/target/follow"
        ? pending
        : Promise.resolve({ message: "Followed" }),
    );

    renderButton();
    fireEvent.click(screen.getByTitle("follow"));
    fireEvent.click(screen.getByTitle("unfollow"));

    await waitFor(() => expect(screen.getByTitle("unfollow")).toBeTruthy());
    const followCalls = vi
      .mocked(api)
      .mock.calls.filter(([path]) => path === "/api/users/target/follow");
    expect(followCalls).toHaveLength(1);

    resolveFollow({ message: "Followed" });
  });
});
