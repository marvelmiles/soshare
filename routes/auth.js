import express from "express";
import { uploadFile } from "../utils/fileHandler.js";
import {
  signup,
  signin,
  userExist,
  refreshTokens,
  verifyToken,
  signout
} from "../controllers/auth.js";

const router = express.Router();

router
  .post(
    "/signup",
    uploadFile({
      dirPath: "avatars",
      single: true,
      type: "image"
    }),
    signup
  )
  .post("/signin", signin)
  .patch("/signout", verifyToken, signout)
  .post("/user-exist", userExist)
  .get("/refresh-token", refreshTokens);

export default router;
