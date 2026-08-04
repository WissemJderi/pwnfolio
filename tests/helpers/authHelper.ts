import request from "supertest";
import app from "../../src/app";

export const registerUser = async (overrides?: {
  email?: string;
  password?: string;
}) => {
  const agent = request.agent(app);

  const res = await agent.post("/api/auth/register").send({
    email: overrides?.email ?? "test@test.com",
    password: overrides?.password ?? "password123",
  });

  return {
    user: res.body.user,
    accessToken: res.body.accessToken,
    agent,
  };
};
