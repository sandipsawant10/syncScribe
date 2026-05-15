import express from "express";
import { getSharedNote } from "../controllers/share.controller";

const router = express.Router();

router.get("/:shareId", getSharedNote);

export default router;
