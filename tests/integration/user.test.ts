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

describe("GET /api/users/:username", () => {
  it("returns the public profile with the user's writeups", async () => {
    const { accessToken } = await registerUser({ email: "hacker@test.com" });
    await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "CTF enjoyer", interests: ["web", "pwn"] });

    await createWriteup(accessToken);

    const res = await request(app).get("/api/users/hacker");

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("hacker");
    expect(res.body.user.bio).toBe("CTF enjoyer");
    expect(res.body.user.interests).toEqual(["web", "pwn"]);
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.writeups).toHaveLength(1);
    expect(res.body.writeups[0]).not.toHaveProperty("sections");
  });

  it("returns 404 for an unknown username", async () => {
    const res = await request(app).get("/api/users/ghost");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/users/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).put("/api/users/me").send({ bio: "hi" });
    expect(res.status).toBe(401);
  });

  it("updates username, bio, and interests", async () => {
    const { accessToken } = await registerUser({ email: "hacker@test.com" });

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        username: "newhandle",
        bio: "Likes to pwn",
        interests: ["crypto", "forensics"],
      });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("newhandle");
    expect(res.body.bio).toBe("Likes to pwn");
    expect(res.body.interests).toEqual(["crypto", "forensics"]);
  });

  it("returns 409 when the username is already taken", async () => {
    await registerUser({ email: "taken@test.com" });
    const { accessToken } = await registerUser({ email: "other@test.com" });

    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "taken" });

    expect(res.status).toBe(409);
  });
});
