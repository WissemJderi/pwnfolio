import { Schema, model, Document, Types } from "mongoose";

export interface IWriteup extends Document {
  title: string;
  category: "web" | "pwn" | "crypto" | "forensics" | "osint" | "misc";
  difficulty?: "easy" | "medium" | "hard" | "insane";
  platform?: string;
  tags: string[];
  sections: {
    recon: string;
    approach: string;
    exploitChain: string;
    takeaway: string;
  };
  cveRefs: string[];
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const writeupSchema = new Schema<IWriteup>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["web", "pwn", "crypto", "forensics", "osint", "misc"],
      required: true,
    },
    difficulty: { type: String, enum: ["easy", "medium", "hard", "insane"] },
    platform: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    sections: {
      recon: { type: String, required: true },
      approach: { type: String, required: true },
      exploitChain: { type: String, required: true },
      takeaway: { type: String, required: true },
    },
    cveRefs: [{ type: String, trim: true }],
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

writeupSchema.index({
  title: "text",
  "sections.recon": "text",
  "sections.approach": "text",
  "sections.exploitChain": "text",
  "sections.takeaway": "text",
});
export default model<IWriteup>("Writeup", writeupSchema);
