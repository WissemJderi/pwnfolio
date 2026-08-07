import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

const darkBtn = () => screen.getByRole("button", { name: /dark/i });
const lightBtn = () => screen.getByRole("button", { name: /light/i });

describe("ThemeToggle", () => {
  it("defaults to dark and marks it pressed", () => {
    render(<ThemeToggle />);
    expect(darkBtn().getAttribute("aria-pressed")).toBe("true");
    expect(lightBtn().getAttribute("aria-pressed")).toBe("false");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("pf-theme")).toBe("dark");
  });

  it("restores the saved light theme", () => {
    localStorage.setItem("pf-theme", "light");
    render(<ThemeToggle />);
    expect(lightBtn().getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to dark for unknown saved values", () => {
    localStorage.setItem("pf-theme", "hacker");
    render(<ThemeToggle />);
    expect(darkBtn().getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("pf-theme")).toBe("dark");
  });

  it("switches theme on click", () => {
    render(<ThemeToggle />);
    fireEvent.click(lightBtn());
    expect(lightBtn().getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("pf-theme")).toBe("light");
  });
});