import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  bio?: string;
  interests: string[];
  links?: {
    github?: string;
    medium?: string;
    website?: string;
    discord?: string;
    x?: string;
    htb?: string;
    tryhackme?: string;
  };
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
    links: {
      type: {
        github: { type: String, trim: true, maxlength: 120 },
        medium: { type: String, trim: true, maxlength: 120 },
        website: { type: String, trim: true, maxlength: 120 },
        discord: { type: String, trim: true, maxlength: 120 },
        x: { type: String, trim: true, maxlength: 120 },
        htb: { type: String, trim: true, maxlength: 120 },
        tryhackme: { type: String, trim: true, maxlength: 120 },
      },
      default: {},
    },
  },
  { timestamps: true },
);

export default model<IUser>("User", userSchema);
