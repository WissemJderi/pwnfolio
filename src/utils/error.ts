import { Response } from "express";

export const handleServerError = (res: Response, err: unknown) => {
  console.error(err);
  return res.status(500).json({ message: "Server error" });
};
