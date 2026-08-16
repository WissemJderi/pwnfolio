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

describe("POST /api/users/:username/follow", () => {
  it("returns 401 without a token", async () => {
    const other = await registerUser({ email: "other@test.com" });

    const res = await request(app).post(`/api/users/${other.user.username}/follow`);
    expect(res.status).toBe(401);
  });

  it("returns 201 and follows the user", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    const res = await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(201);
  });

  it("returns 409 when already following", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);
    const res = await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(409);
  });

  it("returns 404 when the target user does not exist", async () => {
    const me = await registerUser({ email: "myself@test.com" });

    const res = await request(app)
      .post("/api/users/nobody-here/follow")
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 400 when following yourself", async () => {
    const me = await registerUser({ email: "myself@test.com" });

    const res = await request(app)
      .post(`/api/users/${me.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/users/:username/follow", () => {
  it("returns 204 and removes the follow", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);
    const res = await request(app)
      .delete(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when not following yet", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    const res = await request(app)
      .delete(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when the target user does not exist", async () => {
    const me = await registerUser({ email: "myself@test.com" });

    const res = await request(app)
      .delete("/api/users/nobody-here/follow")
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("follow reflected on profile endpoints", () => {
  it("reflects followersCount/followingCount/isFollowedByMe on the public profile", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    const followedRes = await request(app)
      .get(`/api/users/${other.user.username}`)
      .set("Authorization", `Bearer ${me.accessToken}`);
    expect(followedRes.body.user.followersCount).toBe(1);
    expect(followedRes.body.user.followingCount).toBe(0);
    expect(followedRes.body.user.isFollowedByMe).toBe(true);

    const anonymousRes = await request(app).get(`/api/users/${other.user.username}`);
    expect(anonymousRes.body.user.followersCount).toBe(1);
    expect(anonymousRes.body.user.isFollowedByMe).toBe(false);

    const meRes = await request(app).get(`/api/users/${me.user.username}`);
    expect(meRes.body.user.followingCount).toBe(1);
  });

  it("reflects followers/following counts on the profile card", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const other = await registerUser({ email: "other@test.com" });

    await request(app)
      .post(`/api/users/${other.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    const res = await request(app).get(`/api/users/${other.user.username}/card`);
    expect(res.body.stats.followers).toBe(1);
    expect(res.body.stats.following).toBe(0);
  });
});

describe("GET /api/writeups/feed", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/writeups/feed");
    expect(res.status).toBe(401);
  });

  it("returns only published writeups from followed authors, newest first", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const followed = await registerUser({ email: "followed@test.com" });
    const stranger = await registerUser({ email: "stranger@test.com" });

    await request(app)
      .post(`/api/users/${followed.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    const older = await createWriteup(followed.accessToken, {
      title: "Older followed writeup",
      status: "published",
    });
    const newer = await createWriteup(followed.accessToken, {
      title: "Newer followed writeup",
      status: "published",
    });
    await createWriteup(followed.accessToken, {
      title: "Draft from followed author",
      status: "draft",
    });
    await createWriteup(stranger.accessToken, {
      title: "Writeup from someone not followed",
      status: "published",
    });

    const res = await request(app)
      .get("/api/writeups/feed")
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.writeups.map((w: { _id: string }) => w._id)).toEqual([
      newer.body._id,
      older.body._id,
    ]);
  });

  it("returns an empty list when following nobody", async () => {
    const me = await registerUser({ email: "myself@test.com" });

    const res = await request(app)
      .get("/api/writeups/feed")
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.writeups).toEqual([]);
  });

  it("respects page and limit", async () => {
    const me = await registerUser({ email: "myself@test.com" });
    const followed = await registerUser({ email: "followed@test.com" });

    await request(app)
      .post(`/api/users/${followed.user.username}/follow`)
      .set("Authorization", `Bearer ${me.accessToken}`);

    for (let i = 0; i < 3; i++) {
      await createWriteup(followed.accessToken, {
        title: `Feed writeup ${i}`,
        status: "published",
      });
    }

    const res = await request(app)
      .get("/api/writeups/feed?page=1&limit=2")
      .set("Authorization", `Bearer ${me.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });
});
