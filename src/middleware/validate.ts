import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const message = first
        ? `${first.path.join(".") || "body"}: ${first.message}`
        : "Invalid request body";
      return res.status(400).json({ message });
    }
    req.body = result.data;
    next();
  };