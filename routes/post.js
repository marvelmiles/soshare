import express from "express";
import { verifyToken } from "../utils/middlewares.js";
import {
  getFeedPosts,
  likePost,
  dislikePost,
  createPost,
  getPost,
  updatePost,
  deletePost
} from "../controllers/post.js";
import { uploadFile } from "../utils/file-handlers.js";

const router = express.Router();

router
  .post("/new", verifyToken, uploadFile(), createPost)
  .get("/", getFeedPosts)
  .get("/:id", getPost)
  .put("/:id", verifyToken, uploadFile(), updatePost)
  .patch("/:id/like", verifyToken, likePost)
  .patch("/:id/dislike", verifyToken, dislikePost)
  .delete("/:id", verifyToken, deletePost);

export default router;
