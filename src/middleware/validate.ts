import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

const createValidator = (source: "body" | "query" | "params") =>
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      const field = source === "body" ? "body" : source;
      const message = first
        ? `${field}${first.path.length ? `.${first.path.join(".")}` : ""}: ${first.message}`
        : `Invalid request ${field}`;
      return res.status(400).json({ message });
    }

    if (source === "body") {
      req.body = result.data;
    } else {
      Object.assign(req[source], result.data);
    }

    next();
  };

export const validate = createValidator("body");
export const validateQuery = createValidator("query");
export const validateParams = createValidator("params");