import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "./Markdown";

const writeText = vi.mocked(navigator.clipboard.writeText);

describe("Markdown", () => {
  it("renders headings and text", () => {
    render(<Markdown source={"# Nibbles\n\nfirst blood"} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Nibbles");
    expect(screen.getByText("first blood")).toBeTruthy();
  });

  it("opens links in a new tab", () => {
    render(<Markdown source={"[docs](https://example.com)"} />);
    const link = screen.getByRole("link", { name: "docs" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("renders fenced code blocks with the m-pre bar", () => {
    const { container } = render(<Markdown source={"```js\nconst x = 1;\n```"} />);
    const pre = container.querySelector("pre");
    expect(pre?.className).toContain("m-pre");
    expect(container.querySelector(".m-pre-bar")).toBeTruthy();
    expect(screen.getByText("js>")).toBeTruthy();
  });

  it("copies code to the clipboard", async () => {
    render(<Markdown source={"```\nwhoami\n```"} />);
    fireEvent.click(screen.getByRole("button", { name: "copy code" }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain("whoami");
    await screen.findByText("copied");
  });
});