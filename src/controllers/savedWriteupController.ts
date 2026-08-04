import { Response } from "express";
import SavedWriteup from "../models/SavedWriteup";
import { findVisibleWriteup } from "../utils/writeupAccess";
import { AuthRequest } from "../middleware/authMiddleware";

export const saveWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeupId = req.params.id as string;

    const writeup = await findVisibleWriteup(writeupId, req.userId);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    await SavedWriteup.create({ user: req.userId, writeup: writeupId });
    res.status(201).json({ message: "Saved" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "Already saved" });
    }
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const unsaveWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeupId = req.params.id as string;

    const result = await SavedWriteup.findOneAndDelete({
      user: req.userId,
      writeup: writeupId,
    });
    if (!result) {
      return res.status(404).json({ message: "Saved writeup not found" });
    }
    res.status(204).send();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMySavedWriteups = async (req: AuthRequest, res: Response) => {
  try {
    const saved = await SavedWriteup.find({ user: req.userId })
      .populate({
        path: "writeup",
        select: "-sections",
        populate: { path: "author", select: "username" },
      })
      .sort({ createdAt: -1 });

    const writeups = saved.map((s) => s.writeup);
    res.json(writeups);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};
