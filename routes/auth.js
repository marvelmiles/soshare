import express from "express";
import { uploadFile } from "../utils/file-handlers.js";
import { verifyToken } from "../utils/middlewares.js";
import {
  signup,
  signin,
  userExists,
  refreshTokens,
  signout,
  recoverPwd,
  verifyUserToken,
  resetPwd
} from "../controllers/auth.js";

const router = express.Router();

router
  .post(
    "/signup",
    uploadFile({
      dirPath: "avatars",
      single: true,
      type: "image",
      defaultFieldName: "avatar"
    }),
    signup
  )
  .post("/signin", signin)
  .patch("/signout", verifyToken, signout)
  .post("/user-exists", userExists)
  .post("/recover-password", recoverPwd)
  .post("/verify-token", verifyUserToken)
  .post("/reset-password/:token/:userId", resetPwd)
  .get("/refresh-token", refreshTokens);
export default router;
