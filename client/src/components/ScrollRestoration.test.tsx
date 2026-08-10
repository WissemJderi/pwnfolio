import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Link, useNavigate } from "react-router-dom";
import { ScrollRestoration } from "./ScrollRestoration";

const scrollTo = vi.fn();
let scrollY = 0;

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

beforeEach(() => {
  scrollTo.mockReset();
  scrollY = 0;
  sessionStorage.clear();
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  globalThis.scrollTo = scrollTo;
});

describe("ScrollRestoration", () => {
  it("scrolls to top on push navigation", () => {
    render(<Harness />);
    scrollY = 1500;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("saves the scroll position and restores it on pop", () => {
    render(<Harness />);
    scrollY = 1500;
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    scrollY = 900;
    fireEvent.click(screen.getByRole("button", { name: "back" }));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 1500);
  });
});