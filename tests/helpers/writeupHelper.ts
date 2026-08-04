import request from "supertest";
import app from "../../src/app";

export const createWriteup = async (
  token: string,
  overrides?: Record<string, unknown>,
) => {
  const res = await request(app)
    .post("/api/writeups")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "SQL Injection in login form",
      category: "web",
      difficulty: "medium",
      platform: "HackTheBox",
      tags: ["sqli", "web"],
      sections: {
        recon: "Found a login form at /login",
        approach: "Tested for SQLi with payloads",
        exploitChain: "Union-based injection leaked the admin hash",
        takeaway: "Parameterized queries prevent this",
      },
      cveRefs: [],
      ...overrides,
    });

  return res;
};

export const validWriteupBody = {
  title: "SQL Injection in login form",
  category: "web",
  difficulty: "medium",
  platform: "HackTheBox",
  tags: ["sqli", "web"],
  sections: {
    recon: "Found a login form at /login",
    approach: "Tested for SQLi with payloads",
    exploitChain: "Union-based injection leaked the admin hash",
    takeaway: "Parameterized queries prevent this",
  },
};
