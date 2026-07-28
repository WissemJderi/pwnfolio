import { Schema, model, Document, Types } from "mongoose";

export interface ISavedWriteup extends Document {
  user: Types.ObjectId;
  writeup: Types.ObjectId;
  createdAt: Date;
}

const savedWriteupSchema = new Schema<ISavedWriteup>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    writeup: { type: Schema.Types.ObjectId, ref: "Writeup", required: true },
  },
  { timestamps: true },
);

savedWriteupSchema.index({ user: 1, writeup: 1 }, { unique: true });

export default model<ISavedWriteup>("SavedWriteup", savedWriteupSchema);
