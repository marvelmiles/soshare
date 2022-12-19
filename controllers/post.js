import Post from "../models/Post.js";
import { createError } from "../utils/error.js";
import User from "../models/User.js";
import { getAll } from "../utils/index.js";

export const createPost = async (req, res, next) => {
  try {
    console.log(req.files, "creating pos");
    req.body.user = req.user.id;
    req.body.medias = req.files?.map(f => {
      console.log(f);
      return {
        url: f.publicUrl,
        title: f.filename,
        mimetype: f.mimetype
      };
    });
    res.json(await new Post(req.body).save());
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const getFeedPosts = async (req, res, next) => {
  try {
    return res.json(
      await getAll({
        Collection: Post,
        match: {
          user: { $in: (await User.findById(req.user.id)).following }
        },
        populate: {
          path: "user",
          select: req.query.user_select
        }
      })
    );
  } catch (err) {
    next(createError(err.message, 404));
  }
};

export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.get(req.user.id))
      return next(createError("Post already liked by you", 200));
    post.likes.set(req.user.id, true);
    await Post.updateOne(
      {
        _id: req.params.id
      },
      {
        likes: post.likes
      }
    );
    res.json("Post liked by you");
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const dislikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.get(req.user.id)) post.likes.delete(req.user.id);
    await Post.updateOne(
      {
        _id: req.params.id
      },
      {
        likes: post.likes
      }
    );
    res.json("Post disliked by you");
  } catch (err) {
    next(createError(err.message, 409));
  }
};
