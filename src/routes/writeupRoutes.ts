import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import {
  createWriteup,
  getWriteups,
  getWriteupById,
  getFeaturedWriteup,
  getRelatedWriteups,
  getActivityFeed,
  updateWriteup,
  deleteWriteup,
} from "../controllers/writeupController";
import { likeWriteup, unlikeWriteup } from "../controllers/likeController";
import {
  saveWriteup,
  unsaveWriteup,
} from "../controllers/savedWriteupController";
import {
  createComment,
  getComments,
  deleteComment,
} from "../controllers/commentController";
import { validate, validateQuery, validateParams } from "../middleware/validate";
import {
  createWriteupSchema,
  updateWriteupSchema,
  writeupQuerySchema,
  writeupIdParamsSchema,
  commentIdParamsSchema,
  activityFeedQuerySchema,
} from "../../shared/schemas";
import { writeLimiter, interactionLimiter } from "../middleware/rateLimit";

const router = Router();

router.get("/", optionalAuth, validateQuery(writeupQuerySchema), getWriteups);
router.get("/featured", getFeaturedWriteup);
router.get("/feed", requireAuth, validateQuery(activityFeedQuerySchema), getActivityFeed);
router.get("/:id", optionalAuth, validateParams(writeupIdParamsSchema), getWriteupById);
router.get("/:id/related", optionalAuth, validateParams(writeupIdParamsSchema), getRelatedWriteups);
router.post("/", requireAuth, writeLimiter, validate(createWriteupSchema), createWriteup);
router.put("/:id", requireAuth, writeLimiter, validateParams(writeupIdParamsSchema), validate(updateWriteupSchema), updateWriteup);
router.delete("/:id", requireAuth, writeLimiter, validateParams(writeupIdParamsSchema), deleteWriteup);
router.post("/:id/like", requireAuth, interactionLimiter, validateParams(writeupIdParamsSchema), likeWriteup);
router.delete("/:id/like", requireAuth, interactionLimiter, validateParams(writeupIdParamsSchema), unlikeWriteup);
router.post("/:id/save", requireAuth, interactionLimiter, validateParams(writeupIdParamsSchema), saveWriteup);
router.delete("/:id/save", requireAuth, interactionLimiter, validateParams(writeupIdParamsSchema), unsaveWriteup);
router.get("/:id/comments", optionalAuth, validateParams(writeupIdParamsSchema), getComments);
router.post("/:id/comments", requireAuth, interactionLimiter, validateParams(writeupIdParamsSchema), createComment);
router.delete(
  "/:id/comments/:commentId",
  requireAuth,
  interactionLimiter,
  validateParams(commentIdParamsSchema),
  deleteComment,
);

export default router;
