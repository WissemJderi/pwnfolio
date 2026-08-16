import { Response } from "express";
import { handleServerError } from "../utils/error";
import User from "../models/User";
import Follow from "../models/Follow";
import { AuthRequest } from "../middleware/authMiddleware";

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const target = await User.findOne({
      username: req.params.username,
    }).select("_id");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target._id.toString() === req.userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    await Follow.create({ follower: req.userId, following: target._id });
    res.status(201).json({ message: "Followed" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "Already following" });
    }
    return handleServerError(res, err);
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const target = await User.findOne({
      username: req.params.username,
    }).select("_id");
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await Follow.findOneAndDelete({
      follower: req.userId,
      following: target._id,
    });
    if (!result) {
      return res.status(404).json({ message: "Not following" });
    }
    res.status(204).send();
  } catch (err) {
    return handleServerError(res, err);
  }
};
