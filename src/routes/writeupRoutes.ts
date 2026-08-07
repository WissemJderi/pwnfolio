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
import { validate } from "../middleware/validate";
import {
  createWriteupSchema,
  updateWriteupSchema,
} from "../../shared/schemas";

const router = Router();

router.get("/", getWriteups);
router.get("/featured", getFeaturedWriteup);
router.get("/:id", optionalAuth, getWriteupById);
router.post("/", requireAuth, validate(createWriteupSchema), createWriteup);
router.put("/:id", requireAuth, validate(updateWriteupSchema), updateWriteup);
router.delete("/:id", requireAuth, deleteWriteup);
router.post("/:id/like", requireAuth, likeWriteup);
router.delete("/:id/like", requireAuth, unlikeWriteup);
router.post("/:id/save", requireAuth, saveWriteup);
router.delete("/:id/save", requireAuth, unsaveWriteup);
router.get("/:id/comments", optionalAuth, getComments);
router.post("/:id/comments", requireAuth, createComment);
router.delete("/:id/comments/:commentId", requireAuth, deleteComment);

export default router;
