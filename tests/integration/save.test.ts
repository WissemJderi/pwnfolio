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

describe("POST /api/writeups/:id/save", () => {
  it("returns 401 without a token", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app).post(`/api/writeups/${created.body._id}/save`);
    expect(res.status).toBe(401);
  });

  it("returns 201 and saves the writeup", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
  });

  it("returns 409 when already saved", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
  });

  it("returns 404 when the writeup does not exist", async () => {
    const { accessToken } = await registerUser();

    const res = await request(app)
      .post("/api/writeups/000000000000000000000000/save")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/writeups/:id/save", () => {
  it("returns 204 and removes the save", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when not saved yet", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/users/me/saved", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users/me/saved");
    expect(res.status).toBe(401);
  });

  it("returns the user's saved writeups without sections", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    await createWriteup(accessToken, { title: "Unsaved writeup" });

    await request(app)
      .post(`/api/writeups/${created.body._id}/save`)
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .get("/api/users/me/saved")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe(created.body.title);
    expect(res.body[0]).not.toHaveProperty("sections");
    expect(res.body[0].author.username).toBeTruthy();
  });
});
