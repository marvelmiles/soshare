import express from "express";
import { verifyToken } from "../controllers/auth.js";
import {
  getFeedPosts,
  likePost,
  dislikePost,
  createPost
} from "../controllers/post.js";
import { uploadFile } from "../utils/fileHandler.js";

const router = express.Router();

router
  .post(
    "/",
    verifyToken,
    uploadFile({
      single: false,
      dir: "photos/posts"
    }),
    createPost
  )
  .get("/", verifyToken, getFeedPosts)
  .put("/:id/like", verifyToken, likePost)
  .put("/:id/dislike", verifyToken, dislikePost);

export default router;
