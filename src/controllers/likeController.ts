import { Response } from "express";
import { handleServerError } from "../utils/error";
import Like from "../models/Like";
import { findVisibleWriteup } from "../utils/writeupAccess";
import { AuthRequest } from "../middleware/authMiddleware";

export const likeWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeupId = req.params.id as string;

    const writeup = await findVisibleWriteup(writeupId, req.userId);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    await Like.create({ user: req.userId, writeup: writeupId });
    res.status(201).json({ message: "Liked" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "Already liked" });
    }
    return handleServerError(res, err);
  }
};

export const unlikeWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const result = await Like.findOneAndDelete({
      user: req.userId,
      writeup: req.params.id,
    });
    if (!result) {
      return res.status(404).json({ message: "Like not found" });
    }
    res.status(204).send();
  } catch (err) {
    return handleServerError(res, err);
  }
};
