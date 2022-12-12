import express from "express";
import { verifyToken } from "../controllers/auth.js";
import { getUser, getPosts, follow, unfollow } from "../controllers/user.js";

const router = express.Router();

router
  .get("/", verifyToken, getUser)
  .get("/posts", verifyToken, getPosts)
  .put("/:userId/follow", verifyToken, follow)
  .put("/:userId/unfollow", verifyToken, unfollow);

export default router;
