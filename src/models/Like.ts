import { Schema, model, Document, Types } from "mongoose";

export interface ILike extends Document {
  user: Types.ObjectId;
  writeup: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    writeup: { type: Schema.Types.ObjectId, ref: "Writeup", required: true },
  },
  { timestamps: true },
);

likeSchema.index({ user: 1, writeup: 1 }, { unique: true });

export default model<ILike>("Like", likeSchema);
