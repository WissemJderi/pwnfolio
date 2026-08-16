import { Schema, model, Document, Types } from "mongoose";

export type NotificationType = "like" | "comment" | "reply";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  writeup: Types.ObjectId;
  comment?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "comment", "reply"], required: true },
    writeup: { type: Schema.Types.ObjectId, ref: "Writeup", required: true },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
