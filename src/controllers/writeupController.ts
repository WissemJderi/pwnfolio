import { Response } from "express";
import Writeup from "../models/Writeup";
import Like from "../models/Like";
import { AuthRequest } from "../middleware/authMiddleware";

export const createWriteup = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, difficulty, platform, tags, sections, cveRefs } =
      req.body;

    if (!title || !category || !sections) {
      return res
        .status(400)
        .json({ message: "title, category, and sections are required" });
    }

    const writeup = await Writeup.create({
      title,
      category,
      difficulty,
      platform,
      tags,
      sections,
      cveRefs,
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

    const filter: Record<string, unknown> = {};
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
    const writeup = await Writeup.findById(req.params.id).populate(
      "author",
      "username",
    );
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    const likesCount = await Like.countDocuments({ writeup: writeup._id });
    const isLikedByMe = req.userId
      ? !!(await Like.findOne({ user: req.userId, writeup: writeup._id }))
      : false;

    res.json({ ...writeup.toObject(), likesCount, isLikedByMe });
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

    Object.assign(writeup, req.body);
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

    await writeup.deleteOne();
    res.status(204).send();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};
