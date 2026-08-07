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

describe("auth input validation", () => {
  it("rejects a malformed email on register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("email");
  });

  it("rejects a short password on register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
      password: "abc",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("password");
  });

  it("rejects unknown fields on register", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
      password: "password123",
      isAdmin: true,
    });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed email on login", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nope",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects extra fields on change-password", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        currentPassword: "password123",
        newPassword: "password456",
        evil: true,
      });
    expect(res.status).toBe(400);
  });
});

describe("writeup input validation", () => {
  it("rejects an invalid category on create", async () => {
    const { accessToken } = await registerUser();
    const res = await createWriteup(accessToken, { category: "bogus" });
    expect(res.status).toBe(400);
  });

  it("rejects oversized sections on create", async () => {
    const { accessToken } = await registerUser();
    const res = await createWriteup(accessToken, {
      sections: {
        ...validWriteupBody.sections,
        takeaway: "x".repeat(10001),
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("sections");
  });

  it("rejects unknown fields on create", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .post("/api/writeups")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...validWriteupBody, views: 999999 });
    expect(res.status).toBe(400);
  });

  it("rejects invalid status on update", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "deleted" });
    expect(res.status).toBe(400);
  });

  it("lets the author publish a draft", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken, { status: "draft" });
    const res = await request(app)
      .put(`/api/writeups/${created.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "published" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("published");
  });
});

describe("profile input validation", () => {
  it("rejects an invalid username", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ username: "has space!" });
    expect(res.status).toBe(400);
  });

  it("rejects a too-long bio", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "x".repeat(301) });
    expect(res.status).toBe(400);
  });

  it("rejects unknown fields on profile update", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ bio: "hi", points: 1337 });
    expect(res.status).toBe(400);
  });
});