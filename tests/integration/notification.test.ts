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

describe("GET /api/notifications", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("returns an empty list initially", async () => {
    const { accessToken } = await registerUser({ email: "hacker@test.com" });

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("returns notifications newest-first and respects pagination", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const w1 = await createWriteup(author.accessToken, { title: "First" });
    const w2 = await createWriteup(author.accessToken, { title: "Second" });

    await request(app)
      .post(`/api/writeups/${w1.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);
    await request(app)
      .post(`/api/writeups/${w2.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const res = await request(app)
      .get("/api/notifications?limit=1")
      .set("Authorization", `Bearer ${author.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].writeup._id).toBe(w2.body._id);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/notifications/unread-count");
    expect(res.status).toBe(401);
  });

  it("reflects the count as notifications are created and read", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const w = await createWriteup(author.accessToken);

    const before = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(before.body.count).toBe(0);

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const after = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(after.body.count).toBe(1);

    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);
    await request(app)
      .patch(`/api/notifications/${list.body.notifications[0]._id}/read`)
      .set("Authorization", `Bearer ${author.accessToken}`);

    const afterRead = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(afterRead.body.count).toBe(0);
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).patch(
      "/api/notifications/000000000000000000000000/read",
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a notification belonging to someone else", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const stranger = await registerUser({ email: "stranger@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);

    const res = await request(app)
      .patch(`/api/notifications/${list.body.notifications[0]._id}/read`)
      .set("Authorization", `Bearer ${stranger.accessToken}`);

    expect(res.status).toBe(404);
  });

  it("marks the notification read", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const list = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);

    const res = await request(app)
      .patch(`/api/notifications/${list.body.notifications[0]._id}/read`)
      .set("Authorization", `Bearer ${author.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });
});

describe("notification creation hooks", () => {
  it("does not notify when liking your own writeup", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${author.accessToken}`);

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.count).toBe(0);
  });

  it("deletes the unread like notification on unlike", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);
    await request(app)
      .delete(`/api/writeups/${w.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.count).toBe(0);
  });

  it("does not notify when commenting on your own writeup", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ content: "self comment" });

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.count).toBe(0);
  });

  it("notifies the writeup owner on a top-level comment from someone else", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const commenter = await registerUser({ email: "commenter@test.com" });
    const w = await createWriteup(author.accessToken);

    await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ content: "nice writeup" });

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].type).toBe("comment");
  });

  it("notifies both the writeup owner and the parent-comment author on a reply, when they differ", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const commenter = await registerUser({ email: "commenter@test.com" });
    const replier = await registerUser({ email: "replier@test.com" });
    const w = await createWriteup(author.accessToken);

    const topLevel = await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ content: "top level" });

    await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ content: "a reply", parent: topLevel.body._id });

    const authorRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(authorRes.body.notifications).toHaveLength(2);
    expect(
      authorRes.body.notifications.every(
        (n: { type: string }) => n.type === "comment",
      ),
    ).toBe(true);

    const commenterRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${commenter.accessToken}`);
    expect(commenterRes.body.notifications).toHaveLength(1);
    expect(commenterRes.body.notifications[0].type).toBe("reply");
  });

  it("does not notify when replying to your own comment", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const commenter = await registerUser({ email: "commenter@test.com" });
    const w = await createWriteup(author.accessToken);

    const topLevel = await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ content: "top level" });

    await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${commenter.accessToken}`)
      .send({ content: "replying to myself", parent: topLevel.body._id });

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${commenter.accessToken}`);
    expect(res.body.count).toBe(0);
  });

  it("sends exactly one notification when the parent-comment author is also the writeup owner", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const replier = await registerUser({ email: "replier@test.com" });
    const w = await createWriteup(author.accessToken);

    const topLevel = await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${author.accessToken}`)
      .send({ content: "top level from the owner" });

    await request(app)
      .post(`/api/writeups/${w.body._id}/comments`)
      .set("Authorization", `Bearer ${replier.accessToken}`)
      .send({ content: "a reply", parent: topLevel.body._id });

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].type).toBe("comment");
  });
});

describe("PATCH /api/notifications/read-all", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).patch("/api/notifications/read-all");
    expect(res.status).toBe(401);
  });

  it("marks all of the caller's unread notifications read, without touching others'", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const otherAuthor = await registerUser({ email: "other-author@test.com" });
    const liker = await registerUser({ email: "liker@test.com" });
    const w1 = await createWriteup(author.accessToken, { title: "A" });
    const w2 = await createWriteup(otherAuthor.accessToken, { title: "B" });

    await request(app)
      .post(`/api/writeups/${w1.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);
    await request(app)
      .post(`/api/writeups/${w2.body._id}/like`)
      .set("Authorization", `Bearer ${liker.accessToken}`);

    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(res.status).toBe(204);

    const authorCount = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${author.accessToken}`);
    expect(authorCount.body.count).toBe(0);

    const otherAuthorCount = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${otherAuthor.accessToken}`);
    expect(otherAuthorCount.body.count).toBe(1);
  });
});
