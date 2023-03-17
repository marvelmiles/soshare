import express from "express";
import { verifyToken } from "../controllers/auth.js";
import {
  createShort,
  getShort,
  updateShort,
  likeShort,
  dislikeShort,
  getFeedShorts,
  blacklistShort,
  incrementShortViews,
  deleteShort
} from "../controllers/short.js";
import { uploadFile } from "../utils/fileHandler.js";

const router = express.Router();
const uploadConfig = {
  type: "video",
  dirPath: "shorts",
  single: true,
  defaultFieldName: "short"
};
router
  .post("/new", verifyToken, uploadFile(uploadConfig), createShort)
  .get("/", verifyToken, getFeedShorts)
  .get("/:id", getShort)
  .put("/:id", verifyToken, uploadFile(uploadConfig), updateShort)
  .put("/:id/blacklist", verifyToken, blacklistShort)
  .patch("/:id/view", verifyToken, incrementShortViews)
  .patch("/:id/like", verifyToken, likeShort)
  .patch("/:id/dislike", verifyToken, dislikeShort)
  .delete("/:id", verifyToken, deleteShort);
export default router;
