import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CollapsibleSection } from "./CollapsibleSection";

const renderSection = (collapsed: boolean, onToggle: () => void = () => {}) =>
  render(
    <CollapsibleSection id="recon" title="Recon" collapsed={collapsed} onToggle={onToggle}>
      <p>recon content</p>
    </CollapsibleSection>,
  );

describe("CollapsibleSection", () => {
  it("renders title and content when expanded", () => {
    renderSection(false);
    expect(screen.getByText("Recon")).toBeTruthy();
    expect(screen.getByText("recon content")).toBeTruthy();
  });

  it("hides content when collapsed", () => {
    renderSection(true);
    expect(screen.getByText("Recon")).toBeTruthy();
    expect(screen.queryByText("recon content")).toBeNull();
  });

  it("exposes expanded state and wires aria-controls", () => {
    renderSection(false);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-controls")).toBe("recon-content");
  });

  it("calls onToggle when the header is clicked", () => {
    const onToggle = vi.fn();
    renderSection(true, onToggle);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});