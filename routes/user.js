import express from "express";
import { verifyToken } from "../controllers/auth.js";
import {
  getUser,
  getUserPosts,
  follow,
  unfollow,
  suggestFollowers,
  updateUser,
  getFollowers,
  getFollowing,
  getUserNotifications,
  getUnseenAlerts,
  markNotifications,
  getUserShorts,
  blacklistUserRecommendation
} from "../controllers/user.js";
import { uploadFile } from "../utils/fileHandler.js";

const router = express.Router();

router
  .get("/posts", getUserPosts)
  .get("/shorts", getUserShorts)
  .get("/:id/suggest-followers", verifyToken, suggestFollowers)
  .get("/:id/followers", getFollowers)
  .get("/:id/following", getFollowing)
  .get("/notifications", verifyToken, getUserNotifications)
  .get("/unseen-alerts", verifyToken, getUnseenAlerts)
  .get("/:id", getUser)
  .put(
    "/",
    verifyToken,
    uploadFile({
      type: "image",
      dirPath: "avatars",
      single: true,
      defaultFieldName: "avatar"
    }),
    updateUser
  )
  .put("/:userId/follow", verifyToken, follow)
  .put("/:userId/unfollow", verifyToken, unfollow)
  .put(
    "/recommendation/blacklist/:userId",
    verifyToken,
    blacklistUserRecommendation
  )
  .patch("/notifications/mark", verifyToken, markNotifications);
export default router;
