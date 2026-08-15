import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import {
  getPublicProfile,
  getUserCard,
  updateMyProfile,
} from "../controllers/userController";
import { getMySavedWriteups } from "../controllers/savedWriteupController";
import { getMyWriteups } from "../controllers/writeupController";
import { getUsernameStats } from "../controllers/statsController";
import { validate, validateParams } from "../middleware/validate";
import {
  updateProfileSchema,
  usernameParamsSchema,
} from "../../shared/schemas";

const router = Router();

router.get("/me/saved", requireAuth, getMySavedWriteups);
router.get("/me/writeups", requireAuth, getMyWriteups);
router.get("/:username/stats", validateParams(usernameParamsSchema), getUsernameStats);
router.get("/:username/card", validateParams(usernameParamsSchema), getUserCard);
router.get("/:username", optionalAuth, validateParams(usernameParamsSchema), getPublicProfile);
router.put("/me", requireAuth, validate(updateProfileSchema), updateMyProfile);

export default router;
