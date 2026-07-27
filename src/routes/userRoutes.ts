import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getPublicProfile,
  updateMyProfile,
} from "../controllers/userController";

const router = Router();

router.get("/:username", getPublicProfile);
router.put("/me", requireAuth, updateMyProfile);

export default router;
