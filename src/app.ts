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

const app: Application = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(helmet());
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

app.get("/api/protected", requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ message: "You are authenticated", userId: req.userId });
});

export default app;
