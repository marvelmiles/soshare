import express from "express";
import { uploadFile } from "../utils/fileHandler.js";
import {
  signup,
  signin,
  userExist,
  refreshTokens,
  verifyToken,
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
      type: "image"
    }),
    signup
  )
  .post("/signin", signin)
  .patch("/signout", verifyToken, signout)
  .post("/user-exist", userExist)
  .post("/recover-password", recoverPwd)
  .post("/verify-token", verifyUserToken)
  .post("/reset-password", resetPwd)
  .get("/refresh-token", refreshTokens);
export default router;
