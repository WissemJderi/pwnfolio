import { Response } from "express";
import Writeup from "../models/Writeup";
import Like from "../models/Like";
import SavedWriteup from "../models/SavedWriteup";
import Comment from "../models/Comment";
import { findVisibleWriteup } from "../utils/writeupAccess";
import { AuthRequest } from "../middleware/authMiddleware";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");const iRegex = (v: unknown) => ({
  $regex: escapeRegex(String(v)),
  $options: "i",
});

const VIEW_DEDUPE_WINDOW_MS = 10_000;
const recentViews = new Map<string, number>();

const shouldCountView = (writeupId: string, viewer: string) => {
  const key = `${writeupId}:${viewer}`;
  const now = Date.now();
  const last = recentViews.get(key);
  if (last !== undefined && now - last < VIEW_DEDUPE_WINDOW_MS) {
    return false;
  }
  recentViews.set(key, now);
  if (recentViews.size > 10_000) {
    const cutoff = now - VIEW_DEDUPE_WINDOW_MS;
    for (const [k, t] of recentViews) {
      if (t < cutoff) recentViews.delete(k);
    }
  }
  return true;
};

export const createWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      category,
      difficulty,
      platform,
      tags,
      sections,
      cveRefs,
      status,
    } = req.body;

    const writeup = await Writeup.create({
      title,
      category,
      difficulty,
      platform,
      tags,
      sections,
      cveRefs,
      status,
      author: req.userId,
    });

    res.status(201).json(writeup);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const getWriteups = async (req: AuthRequest, res: Response) => {
  try {
    const { category, tag, platform, difficulty, search, sort, page, limit } =
      req.query;

    const filter: Record<string, unknown> = { status: "published" };
    if (category) filter.category = category;
    if (tag) filter.tags = iRegex(tag);
    if (platform) filter.platform = iRegex(platform);
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search as string };

    const sortOption: Record<string, 1 | -1> =
      sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const [writeups, total] = await Promise.all([
      Writeup.find(filter)
        .populate("author", "username")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Writeup.countDocuments(filter),
    ]);

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
      writeups: writeups.map((w) => ({
        ...w.toObject(),
        likesCount: likeCounts.get(String(w._id)) ?? 0,
        commentCount: commentCounts.get(String(w._id)) ?? 0,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const getFeaturedWriteup = async (
  _req: AuthRequest,
  res: Response,
) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const weekly = await Like.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$writeup", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let id = weekly[0]?._id as string | undefined;
    if (!id) {
      const allTime = await Like.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$writeup", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);
      id = allTime[0]?._id as string | undefined;
    }

    if (!id) {
      return res.json({ writeup: null });
    }

    const writeup = await Writeup.findOne({
      _id: id,
      status: "published",
    }).populate("author", "username");
    if (!writeup) {
      return res.json({ writeup: null });
    }

    const likesCount = await Like.countDocuments({ writeup: writeup._id });
    res.json({
      writeup: { ...writeup.toObject(), likesCount },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const getWriteupById = async (req: AuthRequest, res: Response) => {
  try {
    const writeup = await findVisibleWriteup(req.params.id as string, req.userId);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }
    await writeup.populate("author", "username");

    let views = writeup.views ?? 0;
    if (
      writeup.status === "published" &&
      writeup.author._id.toString() !== req.userId &&
      shouldCountView(String(writeup._id), req.userId ?? `ip:${req.ip}`)
    ) {
      await Writeup.updateOne(
        { _id: writeup._id },
        { $inc: { views: 1 } },
      );
      views += 1;
    }

    const likesCount = await Like.countDocuments({ writeup: writeup._id });
    const isLikedByMe = req.userId
      ? !!(await Like.findOne({ user: req.userId, writeup: writeup._id }))
      : false;
    const isSavedByMe = req.userId
      ? !!(await SavedWriteup.findOne({ user: req.userId, writeup: writeup._id }))
      : false;
    const commentCount = await Comment.countDocuments({
      writeup: writeup._id,
    });

    res.json({
      ...writeup.toObject(),
      views,
      likesCount,
      isLikedByMe,
      isSavedByMe,
      commentCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};
export const updateWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeup = await Writeup.findById(req.params.id);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }
    if (writeup.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this writeup" });
    }

    const allowedFields = [
      "title",
      "category",
      "difficulty",
      "platform",
      "tags",
      "sections",
      "cveRefs",
      "status",
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        writeup.set(field, req.body[field]);
      }
    }

    await writeup.save();

    res.json(writeup);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const writeup = await Writeup.findById(req.params.id);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }
    if (writeup.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this writeup" });
    }

    await Promise.all([
      Like.deleteMany({ writeup: writeup._id }),
      SavedWriteup.deleteMany({ writeup: writeup._id }),
      Comment.deleteMany({ writeup: writeup._id }),
    ]);
    await writeup.deleteOne();
    res.status(204).send();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyWriteups = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = { author: req.userId };
    if (status) filter.status = status;

    const writeups = await Writeup.find(filter).sort({ updatedAt: -1 });
    res.json(writeups);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};
