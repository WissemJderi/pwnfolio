import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { generateUniqueUsername } from "../utils/generateUsername";
import { handleServerError } from "../utils/error";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  let createdUser;
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const username = await generateUniqueUsername(email);
    const hashedPassword = await bcrypt.hash(password, 10);
    createdUser = await User.create({
      email,
      password: hashedPassword,
      username,
    });

    const accessToken = generateAccessToken(createdUser._id.toString());
    const refreshToken = generateRefreshToken(createdUser._id.toString());
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({
      accessToken,
      user: {
        id: createdUser._id,
        email: createdUser.email,
        username: createdUser.username,
      },
    });
  } catch (err) {
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id);
    }
    return handleServerError(res, err);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({
      accessToken,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(204).send();
  } catch (err) {
    return handleServerError(res, err);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.status(204).send();
};
