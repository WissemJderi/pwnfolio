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

describe("POST /api/writeups/:id/like", () => {
  it("returns 401 without a token", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app).post(`/api/writeups/${created.body._id}/like`);
    expect(res.status).toBe(401);
  });

  it("returns 201 and likes the writeup", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
  });

  it("returns 409 when already liked", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
  });

  it("returns 404 when the writeup does not exist", async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .post("/api/writeups/000000000000000000000000/like")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/writeups/:id/like", () => {
  it("returns 204 and removes the like", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when not liked yet", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("likes on writeup detail", () => {
  it("reflects likesCount and isLikedByMe", async () => {
    const liker = await registerUser({ email: "liker@test.com" });
    const created = await createWriteup(liker.accessToken);
    await createWriteup(liker.accessToken, {
      title: "Second writeup to distinguish",
    });
    const target = created.body;

    await request(app)
      .post(`/api/writeups/${target._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const likedRes = await request(app)
      .get(`/api/writeups/${target._id}`)
      .set("Authorization", `Bearer ${liker.accessToken}`);
    expect(likedRes.body.likesCount).toBe(1);
    expect(likedRes.body.isLikedByMe).toBe(true);

    const anonymousRes = await request(app).get(`/api/writeups/${target._id}`);
    expect(anonymousRes.body.likesCount).toBe(1);
    expect(anonymousRes.body.isLikedByMe).toBe(false);
  });
});
