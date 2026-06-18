import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  googleAuth,
} from "../controllers/auth.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { handleValidationErrors } from "../middleware/errorHandler.js";
// import { validateRegister } from "../validation/registerValidation.js";
// import { validateLogin } from "../validation/loginValidation.js";

const router = express.Router();

// Public routes
router.post("/register",  handleValidationErrors, register);
router.get("/verify/:token", verifyEmail);
router.post("/login",  handleValidationErrors, login);
router.post("/google", googleAuth);

// Protected routes
router.get("/me", verifyToken, getCurrentUser);
router.post("/logout", verifyToken, logout)

export default router;
