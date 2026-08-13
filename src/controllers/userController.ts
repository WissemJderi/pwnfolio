import { Response } from "express";
import { handleServerError } from "../utils/error";
import User from "../models/User";
import Writeup from "../models/Writeup";
import Like from "../models/Like";
import Comment from "../models/Comment";
import { AuthRequest } from "../middleware/authMiddleware";

export const getPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "username bio interests links createdAt",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const writeups = await Writeup.find({ author: user._id, status: "published" })
      .select("-sections") // exclude full body content from list view
      .populate("author", "username")
      .sort({ createdAt: -1 });

    const writeupIds = writeups.map((w) => w._id);

    const [likeGroups, commentGroups] = await Promise.all([
      Like.aggregate([
        { $match: { writeup: { $in: writeupIds } } },
        { $group: { _id: "$writeup", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { writeup: { $in: writeupIds } } },
        { $group: { _id: "$writeup", count: { $sum: 1 } } },
      ]),
    ]);

    const likeCounts = new Map(
      likeGroups.map((g) => [String(g._id), g.count]),
    );
    const commentCounts = new Map(
      commentGroups.map((g) => [String(g._id), g.count]),
    );

    res.json({
      user,
      writeups: writeups.map((w) => ({
        ...w.toObject(),
        likesCount: likeCounts.get(String(w._id)) ?? 0,
        commentCount: commentCounts.get(String(w._id)) ?? 0,
      })),
    });
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const getUserCard = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({
      username: String(req.params.username).toLowerCase(),
    }).select("username bio interests links createdAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const writeups = await Writeup.find({
      author: user._id,
      status: "published",
    }).select("views");

    const writeupIds = writeups.map((w) => w._id);

    const [likes, comments] = await Promise.all([
      Like.countDocuments({ writeup: { $in: writeupIds } }),
      Comment.countDocuments({ writeup: { $in: writeupIds } }),
    ]);

    res.json({
      username: user.username,
      bio: user.bio,
      interests: user.interests,
      links: user.links,
      createdAt: user.createdAt,
      stats: {
        writeups: writeups.length,
        likes,
        comments,
        views: writeups.reduce((sum, w) => sum + (w.views ?? 0), 0),
      },
    });
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username, bio, interests, links } = req.body;

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (interests) updateData.interests = interests;

    if (links !== undefined && typeof links === "object") {
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(links)) {
        if (typeof value === "string" && value.trim()) {
          clean[key] = value.trim();
        }
      }
      updateData.links = clean;
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("email username bio interests links");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "Username already taken" });
    }
    return handleServerError(res, err);
  }
};
