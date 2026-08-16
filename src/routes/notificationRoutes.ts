import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
} from "../controllers/notificationController";
import { validateQuery, validateParams } from "../middleware/validate";
import {
  notificationQuerySchema,
  notificationIdParamsSchema,
} from "../../shared/schemas";
import { interactionLimiter } from "../middleware/rateLimit";

const router = Router();

router.get("/", requireAuth, validateQuery(notificationQuerySchema), getNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.patch("/read-all", requireAuth, interactionLimiter, markAllRead);
router.patch(
  "/:id/read",
  requireAuth,
  interactionLimiter,
  validateParams(notificationIdParamsSchema),
  markOneRead,
);

export default router;
