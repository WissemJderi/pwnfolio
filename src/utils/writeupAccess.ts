import Writeup from "../models/Writeup";
import { HydratedDocument } from "mongoose";
import { IWriteup } from "../models/Writeup";

export const findVisibleWriteup = async (
  id: string,
  userId?: string,
  options: { publishedOnly?: boolean } = {},
): Promise<HydratedDocument<IWriteup> | null> => {
  const writeup = await Writeup.findById(id);
  if (!writeup) return null;
  if (writeup.status === "draft") {
    if (options.publishedOnly) return null;
    if (writeup.author.toString() !== userId) return null;
  }
  return writeup;
};
