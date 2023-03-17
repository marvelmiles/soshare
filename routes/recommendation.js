import express from "express";
import { blacklistUser } from "../controllers/recommendation";
import { verifyToken } from "../controllers/auth";

const router = express.Router();

router.put("/blacklist/:userId", verifyToken, blacklistUser);

export default router;
