import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";

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
      let baseUsername = user.email.split("@")[0].toLowerCase();
      let candidateUsername = baseUsername;
      let suffix = 1;

      // handle collisions - if the generated username is already taken, append a number
      while (await User.findOne({ username: candidateUsername })) {
        candidateUsername = `${baseUsername}${suffix}`;
        suffix++;
      }

      user.username = candidateUsername;
      await user.save();
      console.log(`Set username "${candidateUsername}" for ${user.email}`);
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
