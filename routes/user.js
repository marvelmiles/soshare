import express from "express";
import { verifyToken } from "../controllers/auth.js";
import {
  getUser,
  getPosts,
  follow,
  unfollow,
  suggestFollowers,
  updateUser,
  getFollowers,
  getFollowing
} from "../controllers/user.js";
import { uploadFile } from "../utils/fileHandler.js";

const router = express.Router();

router

  .get("/", verifyToken, getUser)
  .get("/posts", verifyToken, getPosts)
  .get("/suggest-followers", verifyToken, suggestFollowers)
  .get("/followers", verifyToken, getFollowers)
  .get("/following", verifyToken, getFollowing)
  .put(
    "/",
    verifyToken,
    uploadFile({
      type: "image",
      dirPath: "avatars",
      single: true
    }),
    updateUser
  )
  .put("/:userId/follow", verifyToken, follow)
  .put("/:userId/unfollow", verifyToken, unfollow);

export default router;
