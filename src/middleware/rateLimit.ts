import { rateLimit } from "express-rate-limit";
import { RequestHandler } from "express";

const MESSAGE = { message: "Too many requests — slow down and try again" };

const noop: RequestHandler = (_req, _res, next) => next();

import { NODE_ENV } from "../config/env";

const isTest = NODE_ENV === "test";

export const apiLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: MESSAGE,
    });
export const writeLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many write requests — slow down and try again" },
    });

export const interactionLimiter: RequestHandler = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many interactions — slow down and try again" },
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