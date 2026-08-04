import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
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

  it("returns 403 when a different user tries to change the author", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const intruder = await registerUser({ email: "intruder@test.com" });
    const created = await createWriteup(author.accessToken);

    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`)
      .send({ author: intruder.user.id });

    expect(res.status).toBe(403);
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
