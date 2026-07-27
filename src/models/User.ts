import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  bio?: string;
  interests: string[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    bio: { type: String, trim: true, maxlength: 300 },
    interests: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true },
);

export default model<IUser>("User", userSchema);
