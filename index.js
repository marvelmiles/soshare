// since this is a demo unused files are deleted over the internet
// production wise you might want to just console.log unused file
// and manully delete them just to decrease server workload

// minor issues

// getAll send data in pagination format rather than standard format

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
import socket from "./socket.js";
import { isProdMode, CLIENT_ORIGIN } from "./constants.js";
import { errHandler, validateCors } from "./utils/middlewares.js";
import timeout from "connect-timeout";
import { console500MSG, createError } from "./utils/error.js";

// CONFIGURATIONS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();

const csp = [
  "'self'",
  "blob:",
  "data:",
  "https://apis.google.com",
  "https://*.gstatic.com",
  "https://*.googleapis.com",
  "https://*.firebaseio.com",
  "https://*.firebaseapp.com",
  "https://*.firebase.com",
  "https://*.googleusercontent.com"
];

// MIDDLEWARES

app.use(cors(validateCors));

app.use(
  express.json({
    limit: "200mb",
    extended: true
  })
);
app.use(express.urlencoded({ extended: true }));

// in production helmet causes Failed to load resource:
// net:: ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": csp,
        "script-src": csp,
        "frame-src": csp,
        "connect-src": csp,
        "img-src": csp,
        "media-src": csp
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(cookieParser());
// app.use(timeout("60s"));

app.use("/assets", express.static(path.join(__dirname, "public/assets")));

app.use(express.static("./client/build"));

// ROUTES

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shorts", shortRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api", miscRoutes);
app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});

app.use(errHandler);

// MONGOOSE SETUP

mongoose.set("strictQuery", true);
mongoose.set("strictPopulate", false);

mongoose
  .connect(process.env[isProdMode ? "MONGODB_PROD_URI" : "MONGODB_DEV_URI"], {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    socket(app);
    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch(err => console500MSG(err, "DB_CONNECT_ERR"));
