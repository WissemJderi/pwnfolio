import { Response } from "express";
import Like from "../models/Like";
import Writeup from "../models/Writeup";
import { AuthRequest } from "../middleware/authMiddleware";

export const likeWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeupId = req.params.id as string;

    const writeup = await Writeup.findById(writeupId);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    await Like.create({ user: req.userId, writeup: writeupId });
    res.status(201).json({ message: "Liked" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "Already liked" });
    }
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
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
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};
