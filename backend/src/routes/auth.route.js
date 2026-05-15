import express from "express";
import { body } from "express-validator";
import { signup, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const signupValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);

export default router;