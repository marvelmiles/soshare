import express from "express";
import { uploadFile } from "../utils/fileHandler.js";
import {
  signup,
  signin,
  userExist,
  refreshTokens
} from "../controllers/auth.js";

const router = express.Router();

router
  .post(
    "/signup",
    uploadFile({
      dir: "photos/avatars"
    }),
    signup
  )
  .post("/signin", signin)
  .post("/user-exist", userExist)
  .get("/refresh-token", refreshTokens);

export default router;
