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

const postComment = async (
  token: string,
  writeupId: string,
  body: Record<string, unknown>,
) =>
  request(app)
    .post(`/api/writeups/${writeupId}/comments`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

describe("POST /api/writeups/:id/comments", () => {
  it("returns 401 without a token", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .post(`/api/writeups/${created.body._id}/comments`)
      .send({ content: "hi" });
    expect(res.status).toBe(401);
  });

  it("creates a comment with the author populated", async () => {
    const { accessToken } = await registerUser({ email: "commenter@test.com" });
    const created = await createWriteup(accessToken);

    const res = await postComment(accessToken, created.body._id, {
      content: "Great exploit chain!",
    });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe("Great exploit chain!");
    expect(res.body.author.username).toBeTruthy();
    expect(res.body).not.toHaveProperty("parent");
  });

  it("returns 400 when content is missing", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await postComment(accessToken, created.body._id, {});
    expect(res.status).toBe(400);
  });

  it("returns 404 when the writeup does not exist", async () => {
    const { accessToken } = await registerUser();

    const res = await postComment(accessToken, "000000000000000000000000", {
      content: "hi",
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when the writeup is a draft", async () => {
    const author = await registerUser({ email: "author@test.com" });
    const created = await createWriteup(author.accessToken, {
      status: "draft",
    });

    const res = await postComment(author.accessToken, created.body._id, {
      content: "hi",
    });
    expect(res.status).toBe(404);
  });

  it("creates a reply to an existing comment", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    const comment = await postComment(accessToken, created.body._id, {
      content: "top level",
    });

    const res = await postComment(accessToken, created.body._id, {
      content: "a reply",
      parent: comment.body._id,
    });

    expect(res.status).toBe(201);
    expect(res.body.parent).toBe(comment.body._id);
  });

  it("returns 400 when the parent comment does not exist", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await postComment(accessToken, created.body._id, {
      content: "a reply",
      parent: "000000000000000000000000",
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when the parent belongs to another writeup", async () => {
    const { accessToken } = await registerUser();
    const first = await createWriteup(accessToken);
    const second = await createWriteup(accessToken, { title: "Second one" });
    const comment = await postComment(accessToken, first.body._id, {
      content: "on the first writeup",
    });

    const res = await postComment(accessToken, second.body._id, {
      content: "wrong place",
      parent: comment.body._id,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when replying to a reply", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    const top = await postComment(accessToken, created.body._id, {
      content: "top level",
    });
    const reply = await postComment(accessToken, created.body._id, {
      content: "a reply",
      parent: top.body._id,
    });

    const res = await postComment(accessToken, created.body._id, {
      content: "too deep",
      parent: reply.body._id,
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/writeups/:id/comments", () => {
  it("lists top-level comments with nested replies", async () => {
    const alice = await registerUser({ email: "alice@test.com" });
    const bob = await registerUser({ email: "bob@test.com" });
    const created = await createWriteup(alice.accessToken);

    const top = await postComment(alice.accessToken, created.body._id, {
      content: "first",
    });
    await postComment(bob.accessToken, created.body._id, {
      content: "reply to first",
      parent: top.body._id,
    });
    await postComment(bob.accessToken, created.body._id, { content: "second" });

    const res = await request(app).get(
      `/api/writeups/${created.body._id}/comments`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toBe("first");
    expect(res.body[0].replies).toHaveLength(1);
    expect(res.body[0].replies[0].content).toBe("reply to first");
    expect(res.body[0].replies[0].author.username).toBeTruthy();
    expect(res.body[1].replies).toHaveLength(0);
  });

  it("returns 404 when the writeup is a draft", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken, { status: "draft" });

    const res = await request(app).get(
      `/api/writeups/${created.body._id}/comments`,
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/writeups/:id/comments/:commentId", () => {
  it("lets the comment author delete their own comment", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    const comment = await postComment(accessToken, created.body._id, {
      content: "to be deleted",
    });

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/comments/${comment.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(204);

    const list = await request(app).get(
      `/api/writeups/${created.body._id}/comments`,
    );
    expect(list.body).toHaveLength(0);
  });

  it("returns 403 for someone else's comment", async () => {
    const owner = await registerUser({ email: "owner@test.com" });
    const intruder = await registerUser({ email: "intruder@test.com" });
    const created = await createWriteup(owner.accessToken);
    const comment = await postComment(owner.accessToken, created.body._id, {
      content: "mine",
    });

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/comments/${comment.body._id}`)
      .set("Authorization", `Bearer ${intruder.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown comment", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    const res = await request(app)
      .delete(`/api/writeups/${created.body._id}/comments/000000000000000000000000`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });

  it("deletes replies along with the parent comment", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);
    const top = await postComment(accessToken, created.body._id, {
      content: "top level",
    });
    const reply = await postComment(accessToken, created.body._id, {
      content: "a reply",
      parent: top.body._id,
    });

    await request(app)
      .delete(`/api/writeups/${created.body._id}/comments/${top.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    const replyCheck = await request(app)
      .delete(`/api/writeups/${created.body._id}/comments/${reply.body._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(replyCheck.status).toBe(404);

    const list = await request(app).get(
      `/api/writeups/${created.body._id}/comments`,
    );
    expect(list.body).toHaveLength(0);
  });
});

describe("comment count on writeup detail", () => {
  it("includes commentCount in the writeup detail", async () => {
    const { accessToken } = await registerUser();
    const created = await createWriteup(accessToken);

    await postComment(accessToken, created.body._id, { content: "one" });
    await postComment(accessToken, created.body._id, { content: "two" });

    const res = await request(app).get(`/api/writeups/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.commentCount).toBe(2);
  });
});
