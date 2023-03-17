// since this is a demo unused files are deleted over the internet
// production wise you might want to just console.log unused file
// and manully delete them just to increase response time

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import postRoutes from "./routes/post.js";
import shortRoutes from "./routes/short.js";
import miscRoutes from "./routes/misc.js";
import commentRoutes from "./routes/comment.js";
import cookieParser from "cookie-parser";
import { users, posts } from "./data.js";
import { CLIENT_ENDPOINT } from "./config.js";
import socket from "./socket.js";
import { createError } from "./utils/error.js";

// CONFIGURATIONS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();

// MIDDLEWARES
app.use(
  express.json({
    limit: "30mb",
    extended: true
  })
);
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// app.use(morgan("common"));
app.use(
  cors({
    origin: CLIENT_ENDPOINT,
    optionsSuccessStatus: 200,
    credentials: true
  })
);
app.use(cookieParser());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ROUTES

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shorts", shortRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api", miscRoutes);
if (process.env.NODE_ENV !== "production") {
  // load client side js once browser read index.html
  app.use(express.static("./client/build"));
  app.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}
app.use((err, req, res, next) => {
  err = err.status ? err : createError(err);
  return res.status(err.status).json(err.message);
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
    console.log(`${error.message} did not connect at ${new Date()}`)
  );
