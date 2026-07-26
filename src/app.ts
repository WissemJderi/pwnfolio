import express, { Application, Request, Response } from "express";
import { requireAuth, AuthRequest } from "./middleware/authMiddleware";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import writeupRoutes from "./routes/writeupRoutes";

const app: Application = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/writeups", writeupRoutes);

app.get("/api/protected", requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ message: "You are authenticated", userId: req.userId });
});

export default app;
