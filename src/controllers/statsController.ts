import { Request, Response } from "express";
import User from "../models/User";
import Writeup from "../models/Writeup";
import Like from "../models/Like";
import SavedWriteup from "../models/SavedWriteup";
import Comment from "../models/Comment";

const DIFFICULTIES = ["easy", "medium", "hard", "insane"] as const;

const monthKey = (date: Date): string => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const last12Months = (): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(monthKey(d));
  }
  return out;
};

export const getUsernameStats = async (req: Request, res: Response) => {
  try {
    const username = (req.params.username as string).toLowerCase();
    const user = await User.findOne({ username }).select("_id username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const writeups = await Writeup.find({
      author: user._id,
      status: "published",
    }).select("category difficulty platform createdAt views");

    const ids = writeups.map((w) => w._id);

    const [likes, comments, saves] = await Promise.all([
      Like.countDocuments({ writeup: { $in: ids } }),
      Comment.countDocuments({ writeup: { $in: ids } }),
      SavedWriteup.countDocuments({ writeup: { $in: ids } }),
    ]);

    const byCategory = new Map<string, number>();
    const byDifficulty = new Map<string, number>();
    const byPlatform = new Map<string, number>();
    const monthly = new Map<string, number>();

    for (const w of writeups) {
      byCategory.set(w.category, (byCategory.get(w.category) ?? 0) + 1);
      if (w.difficulty) {
        byDifficulty.set(w.difficulty, (byDifficulty.get(w.difficulty) ?? 0) + 1);
      }
      if (w.platform) {
        byPlatform.set(w.platform, (byPlatform.get(w.platform) ?? 0) + 1);
      }
      monthly.set(monthKey(w.createdAt), (monthly.get(monthKey(w.createdAt)) ?? 0) + 1);
    }

    res.json({
      username: user.username,
      totals: {
        writeups: writeups.length,
        likes,
        comments,
        saves,
        views: writeups.reduce((sum, w) => sum + (w.views ?? 0), 0),
      },
      byCategory: [...byCategory.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      byDifficulty: DIFFICULTIES.filter((d) => byDifficulty.has(d)).map((name) => ({
        name,
        count: byDifficulty.get(name) ?? 0,
      })),
      byPlatform: [...byPlatform.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      activity: last12Months().map((month) => ({
        month,
        count: monthly.get(month) ?? 0,
      })),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: (err as Error).message });
  }
};