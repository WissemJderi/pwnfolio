const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = process.env.PORT ?? "5000";
const MONGO_URI = process.env.MONGO_URI ?? "";
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? (NODE_ENV === "test" ? "test-access-secret" : "");
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? (NODE_ENV === "test" ? "test-refresh-secret" : "");
const CLIENT_URL = process.env.CLIENT_URL ?? "";

const required = [
  { name: "JWT_ACCESS_SECRET", value: JWT_ACCESS_SECRET },
  { name: "JWT_REFRESH_SECRET", value: JWT_REFRESH_SECRET },
];

if (NODE_ENV !== "test") {
  required.unshift({ name: "MONGO_URI", value: MONGO_URI });
}

if (NODE_ENV === "production") {
  required.push({ name: "CLIENT_URL", value: CLIENT_URL });
}

for (const env of required) {
  if (!env.value) {
    throw new Error(`Missing required environment variable: ${env.name}`);
  }
}

export {
  NODE_ENV,
  PORT,
  MONGO_URI,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  CLIENT_URL,
};
