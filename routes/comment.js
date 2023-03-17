import express from "express";
import { verifyToken } from "../controllers/auth.js";
import {
  addComment,
  getComments,
  deleteComment,
  likeComment,
  dislikeComment,
  getComment
} from "../controllers/comment.js";
import { uploadFile } from "../utils/fileHandler.js";
const router = express.Router();

router
  .post(
    "/new/:docType",
    uploadFile({
      type: "image",
      single: true,
      defaultFieldName: "media"
    }),
    verifyToken,
    addComment
  )
  .get("/feed/:documentId", getComments)
  .get("/:id", getComment)
  .patch("/:id/like", verifyToken, likeComment)
  .patch("/:id/dislike", verifyToken, dislikeComment)
  .delete("/:id", verifyToken, deleteComment);
export default router;
