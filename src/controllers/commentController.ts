import { Response } from "express";
import { handleServerError } from "../utils/error";
import Comment from "../models/Comment";
import Notification from "../models/Notification";
import { findVisibleWriteup } from "../utils/writeupAccess";
import { AuthRequest } from "../middleware/authMiddleware";

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { content, parent } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const writeup = await findVisibleWriteup(
      req.params.id as string,
      req.userId,
      { publishedOnly: true },
    );
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    let parentComment = null;
    if (parent) {
      parentComment = await Comment.findOne({
        _id: parent,
        writeup: writeup._id,
      });
      if (!parentComment) {
        return res
          .status(400)
          .json({ message: "Parent comment not found on this writeup" });
      }
      if (parentComment.parent) {
        return res
          .status(400)
          .json({ message: "Replies must be on a top-level comment" });
      }
    }

    const comment = await Comment.create({
      author: req.userId,
      writeup: writeup._id,
      parent,
      content,
    });
    await comment.populate("author", "username");

    if (writeup.author.toString() !== req.userId) {
      await Notification.create({
        recipient: writeup.author,
        actor: req.userId,
        type: "comment",
        writeup: writeup._id,
        comment: comment._id,
      });
    }

    if (
      parent &&
      parentComment &&
      parentComment.author.toString() !== req.userId &&
      parentComment.author.toString() !== writeup.author.toString()
    ) {
      await Notification.create({
        recipient: parentComment.author,
        actor: req.userId,
        type: "reply",
        writeup: writeup._id,
        comment: comment._id,
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const writeup = await findVisibleWriteup(
      req.params.id as string,
      req.userId,
      { publishedOnly: true },
    );
    if (!writeup) {
      return res.status(404).json({ message: "Writeup not found" });
    }

    const topLevel = await Comment.find({ writeup: writeup._id, parent: null })
      .populate("author", "username")
      .sort({ createdAt: 1 });

    const topLevelIds = topLevel.map((c) => c._id);
    const replies = await Comment.find({ parent: { $in: topLevelIds } })
      .populate("author", "username")
      .sort({ createdAt: 1 });

    const repliesByParent = new Map<string, typeof replies>();
    for (const reply of replies) {
      const key = reply.parent!.toString();
      if (!repliesByParent.has(key)) repliesByParent.set(key, []);
      repliesByParent.get(key)!.push(reply);
    }

    res.json(
      topLevel.map((c) => ({
        ...c.toObject(),
        replies: repliesByParent.get(c._id.toString()) ?? [],
      })),
    );
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.commentId as string);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await Comment.deleteMany({ parent: comment._id });
    await comment.deleteOne();
    res.status(204).send();
  } catch (err) {
    return handleServerError(res, err);
  }
};
