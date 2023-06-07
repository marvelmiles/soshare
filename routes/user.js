import express from "express";
import { verifyToken } from "../utils/middlewares.js";
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
  blacklistUserRecommendation,
  deleteUserNotification,
  getBlacklist,
  whitelistUsers
} from "../controllers/user.js";
import { uploadFile } from "../utils/file-handlers.js";

const router = express.Router();

router
  .get("/blacklist", verifyToken, getBlacklist)
  .get("/notifications", verifyToken, getUserNotifications)
  .get("/unseen-alerts", verifyToken, getUnseenAlerts)
  .get("/:userId/posts", getUserPosts)
  .get("/:userId/shorts", getUserShorts)
  .get("/:id/suggest-followers", verifyToken, suggestFollowers)
  .get("/:userId/followers", getFollowers)
  .get("/:userId/following", getFollowing)
  .get("/:userId", getUser)
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
  .patch("/notifications/mark", verifyToken, markNotifications)
  .patch("/whitelist", verifyToken, whitelistUsers)
  .delete("/notifications/:id", verifyToken, deleteUserNotification);
export default router;
