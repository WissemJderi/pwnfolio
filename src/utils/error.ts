import { Response } from "express";
import { logError } from "./logger";

export const handleServerError = (res: Response, err: unknown) => {
  logError("Server error", err);
  return res.status(500).json({ message: "Server error" });
};
