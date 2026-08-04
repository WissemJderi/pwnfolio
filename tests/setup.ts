import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";

let mongoServer: MongoMemoryServer;

export const connectTestDB = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const closeTestDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearTestDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
