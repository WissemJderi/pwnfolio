import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import Like from "../../src/models/Like";
import { connectTestDB, closeTestDB, clearTestDB } from "../setup";
import { registerUser } from "../helpers/authHelper";
import { createWriteup, validWriteupBody } from "../helpers/writeupHelper";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/writeups", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/writeups").send(validWriteupBody);
    expect(res.status).toBe(401);
  });

  it("returns 201 and creates the writeup for an authenticated user", async () => {
    const { accessToken } = await registerUser();

    const res = await createWriteup(accessToken);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(validWriteupBody.title);
    expect(res.body.category).toBe("web");
    expect(res.body.sections.recon).toBeTruthy();
    expect(res.body.author).toBeTruthy();
  });

  it("returns 400 when title is missing", async () => {
    const { accessToken } = await registerUser();

    const res = await createWriteup(accessToken, { title: undefined });

    expect(res.status).toBe(400);
  });

  it("returns 400 when sections are missing", async () => {
    const { accessToken } = await registerUser();

    const res = await createWriteup(accessToken, { sections: undefined });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/writeups", () => {
  it("returns writeups with pagination metadata", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken);

    const res = await request(app).get("/api/writeups");

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(1);
    expect(res.body.writeups[0].author.username).toBeTruthy();
    expect(res.body.pagination).toMatchObject({
      page: 1,
      total: 1,
      totalPages: 1,
    });
  });

  it("filters by category", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { category: "web" });
    await createWriteup(accessToken, { category: "pwn" });

    const res = await request(app).get("/api/writeups?category=pwn");

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(1);
    expect(res.body.writeups[0].category).toBe("pwn");
  });

  it("filters by tag", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { tags: ["sqli"] });
    await createWriteup(accessToken, { tags: ["rop"] });

    const res = await request(app).get("/api/writeups?tag=rop");

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(1);
    expect(res.body.writeups[0].tags).toContain("rop");
  });

  it("searches by text", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { title: "SQL Injection in login form" });
    await createWriteup(accessToken, { title: "Buffer Overflow basics" });

    const res = await request(app).get("/api/writeups?search=Buffer");

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(1);
    expect(res.body.writeups[0].title).toContain("Buffer");
  });

  it("paginates", async () => {
    const { accessToken } = await registerUser();
    for (let i = 0; i < 5; i++) {
      await createWriteup(accessToken, { title: `Writeup number ${i}` });
    }

    const res = await request(app).get("/api/writeups?page=2&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.writeups).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });

  it("filters case-insensitively by tag and platform", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken, { tags: ["Sqli"], platform: "HackTheBox" });

    const byTag = await request(app).get("/api/writeups?tag=sqli");
    expect(byTag.status).toBe(200);
    expect(byTag.body.writeups).toHaveLength(1);

    const byPlatform = await request(app).get("/api/writeups?platform=hackthebox");
    expect(byPlatform.status).toBe(200);
    expect(byPlatform.body.writeups).toHaveLength(1);
    expect(byPlatform.body.writeups[0].platform).toBe("HackTheBox");
  });
});

describe("GET /api/writeups/:id", () => {
  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get(
      "/api/writeups/000000000000000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns the writeup with likes count and isLikedByMe", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app).get(`/api/writeups/${created.body._id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(validWriteupBody.title);
    expect(res.body.likesCount).toBe(0);
    expect(res.body.isLikedByMe).toBe(false);
    expect(res.body.author.username).toBeTruthy();
  });

  it("skips the author's own reads and dedupes rapid duplicate loads", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const r1 = await registerUser({ email: "reader1@test.com" });
    const r2 = await registerUser({ email: "reader2@test.com" });
    const created = await createWriteup(author.accessToken);
    const url = `/api/writeups/${created.body._id}`;

    const asAuthor = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(asAuthor.status).toBe(200);
    expect(asAuthor.body.views).toBe(0);

    const r1First = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${r1.accessToken}`);
    expect(r1First.body.views).toBe(1);

    const r1Dup = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${r1.accessToken}`);
    expect(r1Dup.body.views).toBe(1);

    const r2Read = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${r2.accessToken}`);
    expect(r2Read.body.views).toBe(2);
  });
});

describe("GET /api/writeups/featured", () => {
  it("returns writeup null when nothing has been liked", async () => {
    const { accessToken } = await registerUser();
    await createWriteup(accessToken);

    const res = await request(app).get("/api/writeups/featured");

    expect(res.status).toBe(200);
    expect(res.body.writeup).toBeNull();
  });

  it("returns the most-liked published writeup", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const a = await createWriteup(author.accessToken);
    const b = await createWriteup(author.accessToken, { title: "Second one" });
    const f1 = await registerUser({ email: "fan1@test.com" });
    const f2 = await registerUser({ email: "fan2@test.com" });

    await request(app)
      .post(`/api/writeups/${a.body._id}/like`)
      .set("Authorization", `Bearer ${f1.accessToken}`);
    await request(app)
      .post(`/api/writeups/${a.body._id}/like`)
      .set("Authorization", `Bearer ${f2.accessToken}`);
    await request(app)
      .post(`/api/writeups/${b.body._id}/like`)
      .set("Authorization", `Bearer ${f1.accessToken}`);

    const res = await request(app).get("/api/writeups/featured");

    expect(res.status).toBe(200);
    expect(res.body.writeup._id).toBe(a.body._id);
    expect(res.body.writeup.likesCount).toBe(2);
    expect(res.body.writeup.author.username).toBeTruthy();
  });

  it("falls back to all-time top when there are no recent likes", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const w = await createWriteup(author.accessToken);
    const fan = await registerUser({ email: "fan@test.com" });

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${fan.accessToken}`);

    await Like.updateMany(
      {},
      { $set: { createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } },
    );

    const res = await request(app).get("/api/writeups/featured");

    expect(res.status).toBe(200);
    expect(res.body.writeup._id).toBe(w.body._id);
    expect(res.body.writeup.likesCount).toBe(1);
  });
});

describe("PUT /api/writeups/:id", () => {
  it("returns 401 without a token", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .send({ title: "Hacked title" });

    expect(res.status).toBe(401);
  });

  it("lets the author update their writeup", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated title");
  });

  it("returns 403 when a different user tries to update", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const intruder = await registerUser({ email: "intruder@test.com" });
    const created = await createWriteup(author.accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`)
      .send({ title: "Stolen title" });

    expect(res.status).toBe(403);
  });

  it("rejects unknown fields with 400 before touching the writeup", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const intruder = await registerUser({ email: "intruder@test.com" });
    const created = await createWriteup(author.accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`)
      .send({ author: intruder.user.id });

    expect(res.status).toBe(400);

    const after = await request(app).get(`/api/writeups/${created.body._id}`);
    expect(after.body.author._id).toBe(author.user.id);
  });

  it("does not let the author reassign the writeup to another user", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const victim = await registerUser({ email: "victim@test.com" });
    const created = await createWriteup(author.accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ author: victim.user.id });

    expect(res.status).toBe(400);

    const after = await request(app).get(`/api/writeups/${created.body._id}`);
    expect(after.body.author._id).toBe(author.user.id);
  });
});

describe("DELETE /api/writeups/:id", () => {
  it("lets the author delete their writeup", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/writeups/${created.body._id}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 403 when a different user tries to delete", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const intruder = await registerUser({ email: "intruder@test.com" });
    const created = await createWriteup(author.accessToken);

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`);

    expect(res.status).toBe(403);
  });
});
