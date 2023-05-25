import Post from "../models/Post.js";
import { createError } from "../utils/error.js";
import User from "../models/User.js";
import {
  dislikeMedia,
  likeMedia,
  getFeedMedias,
  getDocument,
  deleteDocument
} from "../utils/req-res-hooks.js";
import { Types } from "mongoose";
import { deleteFile } from "../utils/file-handlers.js";

const serializePostBody = req => {
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
    req.body.moreText = req.body.text.slice(391, 700);
    req.body.text = req.body.text.slice(0, 391);
  }
};

export const createPost = async (req, res, next) => {
  try {
    console.log(" create post,");
    req.body.user = req.user.id;
    serializePostBody(req);
    let post = await new Post(req.body).save();
    await User.updateOne(
      {
        _id: post.user
      },
      {
        $inc: {
          postsCount: 1
        }
      }
    );
    post = await post.populate("user");
    res.json(post);
    const io = req.app.get("socketIo");
    if (io && post.visibility !== "private") {
      io.emit("post", post);
      io.emit("update-user", post.user);
    }
  } catch (err) {
    next(err);
  }
};

export const getFeedPosts = async (req, res, next) => {
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
  return getDocument({ req, res, next, model: Post });
};

export const updatePost = async (req, res, next) => {
  try {
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
    if (io && post.visibility !== "private") io.emit("update-post", post);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  return deleteDocument({ req, res, next, model: Post });
};
