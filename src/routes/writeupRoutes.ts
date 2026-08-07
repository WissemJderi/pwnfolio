import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import {
  createWriteup,
  getWriteups,
  getWriteupById,
  getFeaturedWriteup,
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
} from "../../shared/schemas";

const router = Router();

router.get("/", validateQuery(writeupQuerySchema), getWriteups);
router.get("/featured", getFeaturedWriteup);
router.get("/:id", optionalAuth, validateParams(writeupIdParamsSchema), getWriteupById);
router.post("/", requireAuth, validate(createWriteupSchema), createWriteup);
router.put("/:id", requireAuth, validateParams(writeupIdParamsSchema), validate(updateWriteupSchema), updateWriteup);
router.delete("/:id", requireAuth, validateParams(writeupIdParamsSchema), deleteWriteup);
router.post("/:id/like", requireAuth, validateParams(writeupIdParamsSchema), likeWriteup);
router.delete("/:id/like", requireAuth, validateParams(writeupIdParamsSchema), unlikeWriteup);
router.post("/:id/save", requireAuth, validateParams(writeupIdParamsSchema), saveWriteup);
router.delete("/:id/save", requireAuth, validateParams(writeupIdParamsSchema), unsaveWriteup);
router.get("/:id/comments", optionalAuth, validateParams(writeupIdParamsSchema), getComments);
router.post("/:id/comments", requireAuth, validateParams(writeupIdParamsSchema), createComment);
router.delete(
  "/:id/comments/:commentId",
  requireAuth,
  validateParams(commentIdParamsSchema),
  deleteComment,
);

export default router;
