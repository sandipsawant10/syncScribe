import express from "express";
import { getSharedNote } from "../controllers/share.controller.js";

const router = express.Router();

router.get("/:shareId", getSharedNote);

export default router;
