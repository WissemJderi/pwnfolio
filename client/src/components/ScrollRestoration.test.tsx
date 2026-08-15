import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Link, useNavigate } from "react-router-dom";
import { ScrollRestoration, resetScrollPositions } from "./ScrollRestoration";

let scrollY = 0;
let maxScroll = 0;

const scrollTo = vi.fn((_x: number, y: number) => {
  scrollY = Math.max(0, Math.min(y, maxScroll));
});

const BackButton = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>back</button>;
};

const Harness = () => (
  <MemoryRouter initialEntries={["/a"]}>
    <ScrollRestoration />
    <Routes>
      <Route path="/a" element={<Link to="/b">to b</Link>} />
      <Route path="/b" element={<BackButton />} />
    </Routes>
  </MemoryRouter>
);

const PushHarness = () => (
  <MemoryRouter initialEntries={["/a"]}>
    <ScrollRestoration />
    <Routes>
      <Route path="/a" element={<Link to="/b">to b</Link>} />
      <Route path="/b" element={<Link to="/a">back to a</Link>} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  scrollY = 0;
  maxScroll = 0;
  scrollTo.mockClear();
  resetScrollPositions();
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    get: () => maxScroll + window.innerHeight,
  });
  globalThis.scrollTo = scrollTo as unknown as typeof globalThis.scrollTo;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ScrollRestoration", () => {
  it("scrolls to top on push navigation", () => {
    render(<Harness />);
    maxScroll = 5000;
    scrollY = 1500;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    expect(scrollY).toBe(0);
  });

  it("restores the exact position once the page reaches full height", () => {
    render(<Harness />);
    maxScroll = 5000;
    scrollY = 4200;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    scrollY = 500;
    maxScroll = 200;
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    expect(scrollY).toBe(200);
    vi.advanceTimersByTime(50);
    maxScroll = 6000;
    vi.advanceTimersByTime(100);
    expect(scrollY).toBe(4200);
  });

  it("rests at the bottom when the page never reaches full height", () => {
    render(<Harness />);
    maxScroll = 5000;
    scrollY = 4200;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    maxScroll = 200;
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    vi.advanceTimersByTime(1000);
    expect(scrollY).toBe(200);
  });

  it("stops chasing when the user scrolls manually", () => {
    render(<Harness />);
    maxScroll = 5000;
    scrollY = 4200;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    maxScroll = 200;
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    scrollY = 400;
    vi.advanceTimersByTime(1000);
    expect(scrollY).toBe(400);
    expect(scrollTo).toHaveBeenCalledTimes(3);
  });

  it("restores the saved position on push navigation to a visited path", () => {
    render(<PushHarness />);
    maxScroll = 5000;
    scrollY = 3000;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    expect(scrollY).toBe(0);
    scrollY = 800;
    fireEvent.click(screen.getByRole("link", { name: "back to a" }));
    expect(scrollY).toBe(3000);
  });
});