import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimit";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../../shared/schemas";

const router = Router();

router.use(authLimiter);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

export default router;
