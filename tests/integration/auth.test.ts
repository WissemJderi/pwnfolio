import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { connectTestDB, closeTestDB, clearTestDB } from "../setup";
import { registerUser } from "../helpers/authHelper";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe("POST /api/auth/register", () => {
  it("returns 201 with access token and user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).toMatchObject({
      email: "hacker@test.com",
      username: "hacker",
    });
    expect(res.body.user.id).toBeTruthy();
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
    });

    expect(res.status).toBe(400);
  });

  it("returns 409 when email is already registered", async () => {
    await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "hacker@test.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 with access token for correct credentials", async () => {
    await registerUser({ email: "hacker@test.com" });

    const res = await request(app).post("/api/auth/login").send({
      email: "hacker@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe("hacker@test.com");
  });

  it("returns 401 for wrong password", async () => {
    await registerUser({ email: "hacker@test.com" });

    const res = await request(app).post("/api/auth/login").send({
      email: "hacker@test.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@test.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("returns 200 with a new access token when a refresh cookie exists", async () => {
    const { agent } = await registerUser();

    const res = await agent.post("/api/auth/refresh");

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("returns 401 when there is no refresh cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 204 and invalidates the session", async () => {
    const { agent } = await registerUser();

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(401);
  });
});
