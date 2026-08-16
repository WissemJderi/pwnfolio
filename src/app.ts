import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import { requireAuth, AuthRequest } from "./middleware/authMiddleware";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middleware/rateLimit";
import authRoutes from "./routes/authRoutes";
import writeupRoutes from "./routes/writeupRoutes";
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { errorHandler } from "./middleware/errorMiddleware";
import { CLIENT_URL, NODE_ENV } from "./config/env";

const app: Application = express();
app.disable("x-powered-by");
const clientUrl = CLIENT_URL || "http://localhost:5173";
const allowedOrigin = clientUrl;
const isProduction = NODE_ENV === "production";
if (isProduction && !CLIENT_URL) {
  throw new Error("CLIENT_URL is required in production");
}
if (isProduction) {
  app.set("trust proxy", 1);
}
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'self'"],
        blockAllMixedContent: [],
        fontSrc: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        connectSrc: ["'self'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", apiLimiter);

app.get("/health", (_req: Request, res: Response) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: "ok", db: dbUp ? "up" : "down" });
});

app.use("/api/auth", authRoutes);
app.use("/api/writeups", writeupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/protected", requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ message: "You are authenticated", userId: req.userId });
});

app.use(errorHandler);

export default app;
