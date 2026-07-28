import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getPublicProfile,
  updateMyProfile,
} from "../controllers/userController";
import { getMySavedWriteups } from "../controllers/savedWriteupController";

const router = Router();

router.get("/me/saved", requireAuth, getMySavedWriteups);
router.get("/:username", getPublicProfile);
router.put("/me", requireAuth, updateMyProfile);

export default router;
