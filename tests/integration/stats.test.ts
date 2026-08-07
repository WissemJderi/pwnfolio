import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { connectTestDB, closeTestDB, clearTestDB } from "../setup";
import { registerUser } from "../helpers/authHelper";
import { createWriteup } from "../helpers/writeupHelper";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("GET /api/users/:username/stats", () => {
  it("returns totals and breakdowns for a user's writeups", async () => {
    const { accessToken } = await registerUser({ email: "hacker@test.com" });

    const first = await createWriteup(accessToken, {
      title: "SQLi in login",
      category: "web",
      difficulty: "medium",
      platform: "HackTheBox",
    });
    await createWriteup(accessToken, {
      title: "Heap overflow",
      category: "pwn",
      difficulty: "hard",
      platform: "HackTheBox",
    });
    await createWriteup(accessToken, {
      title: "RSA attacker",
      category: "crypto",
      difficulty: "easy",
      platform: "TryHackMe",
    });

    await request(app)
      .post(`/api/writeups/${first.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app).get("/api/users/hacker/stats");

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("hacker");
    expect(res.body.totals).toEqual({
      writeups: 3,
      likes: 1,
      comments: 0,
      saves: 0,
      views: 0,
    });
    expect(res.body.byCategory).toEqual([
      { name: "web", count: 1 },
      { name: "pwn", count: 1 },
      { name: "crypto", count: 1 },
    ]);
    expect(res.body.byDifficulty).toEqual([
      { name: "easy", count: 1 },
      { name: "medium", count: 1 },
      { name: "hard", count: 1 },
    ]);
    expect(res.body.byPlatform[0]).toEqual({ name: "HackTheBox", count: 2 });
    expect(res.body.activity).toHaveLength(12);
    expect(res.body.activity.reduce((s: number, a: { count: number }) => s + a.count, 0)).toBe(3);
  });

  it("excludes drafts and never-edited drafts count zero", async () => {
    const { accessToken } = await registerUser({ email: "drafts@test.com" });
    await createWriteup(accessToken, { status: "draft", title: "secret draft" });

    const res = await request(app).get("/api/users/drafts/stats");

    expect(res.status).toBe(200);
    expect(res.body.totals.writeups).toBe(0);
    expect(res.body.byCategory).toEqual([]);
  });

  it("returns 404 for an unknown username", async () => {
    const res = await request(app).get("/api/users/ghost/stats");
    expect(res.status).toBe(404);
  });
});