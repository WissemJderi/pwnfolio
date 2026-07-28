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

export default router;
