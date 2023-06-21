// since this is a demo unused files are deleted over the internet
// production wise you might want to just console.log unused file
// and manully delete them just to decrease server workload

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import postRoutes from "./routes/post.js";
import shortRoutes from "./routes/short.js";
import miscRoutes from "./routes/misc.js";
import commentRoutes from "./routes/comment.js";
import cookieParser from "cookie-parser";
import { CLIENT_ENDPOINT } from "./config.js";
import socket from "./socket.js";
import { createError } from "./utils/error.js";
import { deleteFile } from "./utils/file-handlers.js";

// CONFIGURATIONS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();

// MIDDLEWARES

app.use(
  cors({
    origin: CLIENT_ENDPOINT,
    optionsSuccessStatus: 200,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "200mb",
    extended: true
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(cookieParser());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(express.static("./client/build"));
// ROUTES

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shorts", shortRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api", miscRoutes);
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    console.warn(
      "[SERVER_ERROR: HEADER SENT]",
      req.headers.origin,
      req.originalUrl,
      " at ",
      new Date()
    );
  } else {
    err = err.status ? err : createError(err);
    if (err) res.status(err.status).json(err.message);
  }
  if (req.file) deleteFile(req.file.publicUrl);
  if (req.files)
    for (const { publicUrl } of req.files) {
      deleteFile(publicUrl);
    }
});

// MONGOOSE SETUP

mongoose.set("strictQuery", true);
mongoose.set("strictPopulate", false);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    socket(app);
    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch(error =>
    console.log(
      `[SERVER_ERROR: DB_CONNECT_ERR] ${
        error.message
      } did not connect at ${new Date()}`
    )
  );
