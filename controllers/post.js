import Post from "../models/Post.js";
import { createError } from "../utils/error.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import {
  getAll,
  dislikeMedia,
  likeMedia,
  getFeedMedias,
  createVisibilityQuery
} from "../utils/index.js";
import { Types } from "mongoose";
import { verifyToken } from "./auth.js";
import { deleteFile } from "../utils/fileHandler.js";

const serializePostBody = req => {
  console.log(req.files, " serialize post..");
  if (!(req.files.length || req.body.text))
    throw createError("Invalid body expect a file list or text key value");
  if (req.files.length)
    req.body.medias = req.files.map(f => ({
      id: new Types.ObjectId().toString(),
      url: f.publicUrl,
      mimetype: f.mimetype
    }));
  else req.body.medias = [];
  if (req.body.text?.length > 390) {
    req.body.moreText = req.body.text.slice(391, 701);
    req.body.text = req.body.text.slice(0, 390);
  }
};

export const createPost = async (req, res, next) => {
  try {
    console.log(" creating pos ");
    req.body.user = req.user.id;
    serializePostBody(req);
    const post = await (await new Post(req.body).save()).populate("user");
    const io = req.app.get("socketIo");
    console.log(!!io, post.visibility);
    if (io && post.visibility !== "private")
      io.volatile.emit("feed-post", post);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const getFeedPosts = async (req, res, next) => {
  console.log("fetching feed posts...");
  return getFeedMedias({
    model: Post,
    req,
    res,
    next
  });
};

export const likePost = async (req, res, next) => {
  return likeMedia(Post, req, res, next);
};

export const dislikePost = async (req, res, next) => {
  return dislikeMedia(Post, req, res, next);
};

export const getPost = async (req, res, next) => {
  try {
    console.log("getting post");
    verifyToken(req, { _noNext: true, throwErr: false });
    const query = await createVisibilityQuery(req.user?.id);
    query._id = req.params.id;
    console.log(query, req.user?.id);
    res.json(await Post.findOne(query).populate("user"));
    console.log("returned post ");
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    console.log(req.body);
    serializePostBody(req);
    let medias = (await Post.findOne({
      _id: req.params.id
    })).medias;
    if (req.body.excludeMedias) {
      for (const id of req.body.excludeMedias.split(",")) {
        medias = medias.filter(m => {
          if (id === m.id) {
            deleteFile(m.url);
            return false;
          }
          return true;
        });
      }
    }
    req.body.medias = req.body.medias.concat(medias);
    const post = await Post.findOneAndUpdate(
      {
        _id: req.params.id
      },
      req.body,
      { new: true }
    ).populate("user");
    const io = req.app.get("socketIo");
    if (io && post.visibility !== "private")
      io.volatile.emit("update-feed-post", post);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const { medias, _id } = (await Post.findByIdAndDelete(req.params.id)) || {};
    if (_id) {
      res.json("Successfully deleted post");
      const io = req.app.get("socketIo");
      io && io.volatile.emit("filter-post", _id);
      await Comment.deleteMany({
        $or: [
          { document: _id },
          {
            rootThread: _id
          }
        ]
      });
    }
    if (medias) {
      for (let { url } of medias) {
        deleteFile(url);
      }
    }
    return;
  } catch (err) {
    next(err);
  }
};
