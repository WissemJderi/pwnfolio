import { Schema, model, Document, Types } from "mongoose";

export interface IComment extends Document {
  author: Types.ObjectId;
  writeup: Types.ObjectId;
  parent?: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    writeup: { type: Schema.Types.ObjectId, ref: "Writeup", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment" },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

commentSchema.index({ writeup: 1, createdAt: 1 });

export default model<IComment>("Comment", commentSchema);
