import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  generateSummary,
  toggleShare,
} from "../controllers/note.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotes);
router.post("/", createNote);
router.get("/:id", getNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);
router.post("/:id/generate-summary", generateSummary);
router.post("/:id/share", toggleShare);

export default router;
