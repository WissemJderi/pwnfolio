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

describe("draft writeups", () => {
  it("creates a writeup as published by default", async () => {
    const { accessToken } = await registerUser();
    const res = await createWriteup(accessToken);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("published");
  });

  it("creates a draft when status is draft", async () => {
    const { accessToken } = await registerUser();
    const res = await createWriteup(accessToken, { status: "draft" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("draft");
  });

  it("rejects an invalid status on create", async () => {
    const { accessToken } = await registerUser();
    const res = await createWriteup(accessToken, { status: "banana" });
    expect(res.status).toBe(400);
  });

  it("hides drafts from the public list", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { status: "draft" });

    const res = await request(app).get("/api/writeups");
    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(0);
  });

  it("returns 404 for a draft to an anonymous user", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken, { status: "draft" });

    const res = await request(app).get(`/api/writeups/${created.body._id}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a draft to another authenticated user", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const other = await registerUser({ email: "other@test.com" });
    const created = await createWriteup(author.accessToken, {
      status: "draft",
    });

    const res = await request(app)
      .get(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${other.accessToken}`);
    expect(res.status).toBe(404);
  });

  it("lets the author see their own draft", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken, { status: "draft" });

    const res = await request(app)
      .get(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("draft");
  });

  it("lets the author publish a draft via update", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken, { status: "draft" });

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "published" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("published");

    const list = await request(app).get("/api/writeups");
    expect(list.body.writeups).toHaveLength(1);
  });

  it("rejects an invalid status on update", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "banana" });
    expect(res.status).toBe(400);
  });

  it("prevents liking a draft", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const other = await registerUser({ email: "other@test.com" });
    const created = await createWriteup(author.accessToken, {
      status: "draft",
    });

    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${other.accessToken}`);
    expect(res.status).toBe(404);
  });

  it("lists my own writeups including drafts", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { status: "draft" });
    await createWriteup(accessToken);

    const res = await request(app)
      .get("/api/users/me/writeups")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const statuses = res.body
      .map((w: { status: string }) => w.status)
      .sort();
    expect(statuses).toEqual(["draft", "published"]);
  });

  it("requires auth for my writeups", async () => {
    const res = await request(app).get("/api/users/me/writeups");
    expect(res.status).toBe(401);
  });
});

describe("writeup deletion cleanup", () => {
  it("removes likes, saves, and comments when a writeup is deleted", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await request(app)
      .post(`/api/writeups/${created.body._id}/like`)
      .set("Authorization", `Bearer ${accessToken}`);
    await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);
    await request(app)
      .post(`/api/writeups/${created.body._id}/comments`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "nice writeup!" });

    const del = await request(app)
      .delete(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(del.status).toBe(204);

    const saved = await request(app)
      .get("/api/users/me/saved")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(saved.body).toHaveLength(0);
  });
});
