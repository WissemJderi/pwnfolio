import { Schema, model, Document, Types } from "mongoose";

export interface IChainStep {
  id: string;
  title: string;
  description: string;
  technique?: string;
  tool?: string;
  cveRef?: string;
}

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
  chainSteps: IChainStep[];
  status: "draft" | "published";
  views: number;
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
    chainSteps: [
      {
        _id: false,
        id: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        technique: { type: String, trim: true },
        tool: { type: String, trim: true },
        cveRef: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    views: { type: Number, default: 0 },
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
