import { Response } from "express";
import Writeup from "../models/Writeup";
import Like from "../models/Like";
import SavedWriteup from "../models/SavedWriteup";
import Comment from "../models/Comment";
import { findVisibleWriteup } from "../utils/writeupAccess";
import { AuthRequest } from "../middleware/authMiddleware";

const VALID_STATUSES = ["draft", "published"] as const;

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

    if (!title || !category || !sections) {
      return res
        .status(400)
        .json({ message: "title, category, and sections are required" });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be draft or published" });
    }

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
    if (tag) filter.tags = tag;
    if (platform) filter.platform = platform;
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

    res.json({
      writeups,
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

export const getWriteupById = async (req: AuthRequest, res: Response) => {
  try {
    const writeup = await findVisibleWriteup(req.params.id as string, req.userId);
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }
    await writeup.populate("author", "username");

    const likesCount = await Like.countDocuments({ writeup: writeup._id });
    const isLikedByMe = req.userId
      ? !!(await Like.findOne({ user: req.userId, writeup: writeup._id }))
      : false;
    const commentCount = await Comment.countDocuments({
      writeup: writeup._id,
    });

    res.json({
      ...writeup.toObject(),
      likesCount,
      isLikedByMe,
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

    const unknownFields = Object.keys(req.body).filter(
      (key) => !(allowedFields as readonly string[]).includes(key),
    );
    if (unknownFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid fields: ${unknownFields.join(", ")}` });
    }

    if (
      req.body.status !== undefined &&
      !VALID_STATUSES.includes(req.body.status)
    ) {
      return res
        .status(400)
        .json({ message: "status must be draft or published" });
    }

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
