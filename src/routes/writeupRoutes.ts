import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import {
  createWriteup,
  getWriteups,
  getWriteupById,
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

const router = Router();

router.get("/", getWriteups);
router.get("/:id", optionalAuth, getWriteupById);
router.post("/", requireAuth, createWriteup);
router.put("/:id", requireAuth, updateWriteup);
router.delete("/:id", requireAuth, deleteWriteup);
router.post("/:id/like", requireAuth, likeWriteup);
router.delete("/:id/like", requireAuth, unlikeWriteup);
router.post("/:id/save", requireAuth, saveWriteup);
router.delete("/:id/save", requireAuth, unsaveWriteup);
router.get("/:id/comments", optionalAuth, getComments);
router.post("/:id/comments", requireAuth, createComment);
router.delete("/:id/comments/:commentId", requireAuth, deleteComment);

export default router;
