import { rateLimit } from "express-rate-limit";
import { RequestHandler } from "express";

const MESSAGE = { message: "Too many requests — slow down and try again" };

const noop: RequestHandler = (_req, _res, next) => next();

const isTest = process.env.NODE_ENV === "test";

export const apiLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: MESSAGE,
    });

export const authLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: MESSAGE,
    });