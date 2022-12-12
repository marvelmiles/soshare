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
import cookieParser from "cookie-parser";
import { users, posts } from "./data.js";

/* CONFIGURATIONS */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();
app.use(
  express.json({
    limit: "30mb",
    extended: true
  })
);
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());
app.use(cookieParser());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* ROUTES */

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/user", userRoutes);
if (process.env.NODE_ENV !== "production") {
  // load client side js once browser read index.html
  app.use(express.static("./client/build"));
  app.get("/*", function(req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}
app.use((err, req, res, next) => {
  return res
    .status(err.status || 500)
    .json(err.message || "Something went wrong!");
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 8800;
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server connected on port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch(error =>
    console.log(`${error.message} did not connect at ${new Date()}`)
  );
