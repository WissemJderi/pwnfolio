import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import { generateUniqueUsername } from "../utils/generateUsername";

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    const usersWithoutUsername = await User.find({
      $or: [{ username: { $exists: false } }, { username: null }],
    });

    console.log(
      `Found ${usersWithoutUsername.length} user(s) missing a username`,
    );

    for (const user of usersWithoutUsername) {
      user.username = await generateUniqueUsername(user.email);
      await user.save();
      console.log(`Set username "${user.username}" for ${user.email}`);
    }

    console.log("Migration complete");
  } catch (err) {
    console.error("Migration failed:", (err as Error).message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrate();
