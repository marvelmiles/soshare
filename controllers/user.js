import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import { getAll } from "../utils/index.js";

export const getUser = async (req, res, next) => {
  try {
    return res.json(await User.findById(req.params.id));
  } catch (err) {
    next(createError(err.message), 404);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const following = await User.findById(req.user.id)
      .select("following -_id")
      .populate("following", req.query.user_select);
    res.json(following);
  } catch (err) {
    next(createError(err.message, 404));
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const followers = await User.findById(req.user.id)
      .select("followers -_id")
      .populate("followers", req.query.user_select);
    res.json(followers);
  } catch (err) {
    next(createError(err.message, 404));
  }
};

export const follow = async (req, res, next) => {
  try {
    if (req.user.id === req.params.userId)
      return next(createError("You can't follow yourself"));
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $addToSet: {
          following: req.params.userId
        }
      }
    );
    await User.updateOne(
      {
        _id: req.params.userId
      },
      {
        $addToSet: {
          followers: req.user.id
        }
      }
    );
    res.json("Successfully followed user");
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const unfollow = async (req, res, next) => {
  try {
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $pull: {
          following: req.params.userId
        }
      }
    );
    await User.updateOne(
      {
        _id: req.params.userId
      },
      {
        $pull: {
          followers: req.user.id
        }
      }
    );
    res.json("Successfully unfollowed user");
  } catch (err) {
    next(createError(err.message, 409));
  }
};

export const getPosts = async (req, res, next) => {
  try {
    res.json(
      await getAll({
        Collection: Post,
        match: { user: req.user.id },
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
