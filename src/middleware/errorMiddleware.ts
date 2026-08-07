import { NextFunction, Request, Response } from "express";
import { logError } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  logError("Unhandled server error", err);
  return res.status(500).json({ message: "Server error" });
};
