import { Response } from "express";
import { handleServerError } from "../utils/error";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/authMiddleware";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { recipient: req.userId };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("actor", "username")
        .populate("writeup", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filter),
    ]);

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.userId,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const markOneRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true },
    );
    res.status(204).send();
  } catch (err) {
    return handleServerError(res, err);
  }
};
