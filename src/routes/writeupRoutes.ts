import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  createWriteup,
  getWriteups,
  getWriteupById,
  updateWriteup,
  deleteWriteup,
} from "../controllers/writeupController";

const router = Router();

router.get("/", getWriteups);
router.get("/:id", getWriteupById);
router.post("/", requireAuth, createWriteup);
router.put("/:id", requireAuth, updateWriteup);
router.delete("/:id", requireAuth, deleteWriteup);

export default router;
