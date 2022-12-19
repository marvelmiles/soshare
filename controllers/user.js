import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import { getAll } from "../utils/index.js";
import { deleteFile } from "../utils/fileHandler.js";

export const getUser = async (req, res, next) => {
  try {
    return res.json(await User.findById(req.params.id));
  } catch (err) {
    next(createError(err.message), 404);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    res.json(
      (await User.findById(req.user.id).populate({
        path: "following",
        model: "users"
      })).following
    );
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    res.json(
      (await User.findById(req.user.id).populate({
        path: "followers",
        model: "users"
      })).followers
    );
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

export const suggestFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    // console.log(
    //   (await User.find({
    //     _id: {
    //       $ne: req.user.id,
    //       $nin: user.following,
  //       $nin: user.followers
    //     }
    //   })).length,
    //   user.following.length,
    //   user.followers.length
    // );
    res.json(
      await User.find({
        _id: {
          $ne: req.user.id,
          $nin: user.following,
          $nin: user.followers
        }
      })
    );
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true
    });
    if (req.file) {
      req.body.photoUrl = req.file.publicUrl;
      await deleteFile(user.photoUrl).catch(err =>
        console.log(
          `Failed to delete avatar ${user.photoUrl} at ${new Date()}: ${
            err.message
          }`
        )
      );
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
