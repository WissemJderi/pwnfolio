import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, fmtDate, getAuthorId, readTime } from "./format";

describe("fmtDate", () => {
  it("formats ISO dates", () => {
    const out = fmtDate("2024-06-15T12:00:00Z");
    expect(out).toContain("2024");
    expect(out).toContain("Jun");
  });
});

describe("CATEGORY_LABELS", () => {
  it("labels every category", () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6);
    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("getAuthorId", () => {
  it("returns the id for populated author refs", () => {
    expect(getAuthorId({ author: { _id: "abc", username: "x" } })).toBe("abc");
  });

  it("returns the author string when not populated", () => {
    expect(getAuthorId({ author: "wissem" })).toBe("wissem");
  });

  it("returns undefined for missing author", () => {
    expect(getAuthorId({ author: null })).toBeUndefined();
    expect(getAuthorId({ author: { username: "x" } })).toBeUndefined();
  });
});

describe("readTime", () => {
  it("returns at least 1 minute", () => {
    expect(readTime({ title: "hi" })).toBe(1);
  });

it("counts title and section body", () => {
    const body = Array(300).fill("word").join(" ");
    expect(
      readTime({ title: "t title", sections: { recon: body, approach: "", exploitChain: "", takeaway: "" } }),
    ).toBe(2);
  });
});