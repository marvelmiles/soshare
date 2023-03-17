import User from "../models/User.js";
import { createError } from "../utils/error.js";
import Post from "../models/Post.js";
import { getAll, sendAndUpdateNotification } from "../utils/index.js";
import { deleteFile } from "../utils/fileHandler.js";
import Notification from "../models/Notification.js";
import mongoose, { isValidObjectId } from "mongoose";
import Short from "../models/Short.js";
import { verifyToken } from "./auth.js";
import { isObject } from "../utils/validators.js";
import bcrypt from "bcrypt";

export const getUser = async (req, res, next) => {
  try {
    console.log("getting user...");
    return res.json(await User.findById(req.params.id));
  } catch (err) {
    next(createError("Faulty request", 400));
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    console.log(req.params, "following...");
    const d = await getAll({
      model: User,
      dataKey: "following",
      match: {
        _id: req.params.id
      }
    });
    res.json(d);
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    console.log("getting followers", req.params.id);
    res.json(
      await getAll({
        model: User,
        dataKey: "followers",
        match: {
          _id: req.params.id
        }
      })
    );
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

export const follow = async (req, res, next) => {
  try {
    console.log("to follow ", req.params.userId);
    if (req.user.id === req.params.userId)
      throw createError("You can't follow yourself");
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
    sendAndUpdateNotification({
      req,
      type: "follow"
    });
  } catch (err) {
    next(err);
  }
};

export const unfollow = async (req, res, next) => {
  try {
    console.log("to unfollow ", req.params.userId);
    if (req.params.userId === req.user.id)
      throw createError("You can't unfollow yourself");
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          following: req.params.userId
        }
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      req.params.userId,
      {
        $pull: {
          followers: req.user.id
        }
      },
      { new: true }
    );
    res.json("Successfully unfollowed user");
    sendAndUpdateNotification({
      req,
      type: "follow",
      filter: true
    });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    let match;

    if (req.query.id) {
      match = {
        user: req.query.id,
        visibility: "everyone"
      };
    } else {
      await verifyToken(req, {
        _noNext: true
      });
      match = {
        user: req.user.id
      };
    }
    res.json(
      await getAll({
        req,
        match,
        model: Post,
        populate: {
          path: "user",
          select: req.query.user_select
        }
      })
    );
  } catch (err) {
    next(err);
  }
};

export const suggestFollowers = async (req, res, next) => {
  try {
    console.log("suggestitnh", req.user.id);
    res.json(
      await getAll({
        model: User,
        match: {
          _id: {
            $ne: new mongoose.Types.ObjectId(req.user.id),
            $nin: (await User.findById(req.user.id)).following
          }
        }
      })
    );
    const ev = req.app.get("event");
    if (ev) ev.emit("schedule-suggest-followers", req.user.id);
  } catch (err) {
    console.log(err.message, err.name, " s");
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    console.log("updating user... ", req.body);
    req.body.photoUrl = req.file?.publicUrl;
    const { _id, photoUrl, socials } = (await User.findById(req.user.id)) || {};
    if (!_id) {
      next(createError("Account doesn't exist", 400));
      req.file.publicUrl &&
        (await deleteFile(req.file.publicUrl).catch(err =>
          console.log(
            `Failed to delete avatar ${req.file.publicUrl} at ${new Date()}: ${
              err.message
            }`
          )
        ));
      return;
    }
    if (req.body.socials) {
      if (!isObject(req.body.socials))
        return next(
          createError(
            `Expect body.socials to be of type Object got ${typeof req.body
              .socials}`,
            400
          )
        );
      req.body.socials = {
        ...socials,
        ...req.body.socials
      };
    }

    if (req.body.password) {
      if (req.body.password.length < 8)
        throw createError("A minimum of 8 character password is required", 400);
      req.body.password = await bcrypt.hash(
        req.body.password,
        await bcrypt.genSalt()
      );
    }
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true
    });
    const io = req.app.get("socketIo");
    if (io) io.volatile.emit("update-user", user);
    res.json(user);
    if (user.photoUrl && photoUrl) {
      await deleteFile(photoUrl).catch(err =>
        console.log(
          `Failed to delete avatar ${photoUrl} at ${new Date()}: ${err.message}`
        )
      );
    }
  } catch (err) {
    next(err);
  }
};

export const getUserNotifications = async (req, res, next) => {
  try {
    console.log("getting notifi", req.query);
    const match = {
      $or: [
        {
          to: req.user.id
        },
        {
          [`reports.${req.user.id}.marked`]: req.query.type === "marked",
          [`reports.${req.user.id}.expireAt`]: null
        }
      ]
    };
    if (req.query.timeago) {
      match.createdAt = {
        $lte: new Date(),
        $gte: new Date(req.query.timeago)
      };
    }
    const f = await getAll({
      model: Notification,
      match,
      populate: [
        {
          path: "from to threads"
        },
        {
          path: "document",
          populate: [
            {
              path: "user"
            },
            {
              path: "document",
              populate: "user"
            }
          ]
        }
      ]
    });
    // console.log(f.data[0]);
    res.json(f);
  } catch (err) {
    next(err);
  }
};

// trying to avoid multiple api call for a similar purpose
export const getUnseenAlerts = async (req, res, next) => {
  try {
    const query = {
      $or: [
        {
          to: req.user.id
        },
        {
          [`reports.${req.user.id}.marked`]: false,
          [`reports.${req.user.id}.expireAt`]: null
        }
      ]
    };
    if (req.query.timeago) {
      query.createdAt = {
        $lte: new Date(),
        $gte: new Date(req.query.timeago)
      };
    }

    res.json({
      notifications: await Notification.find(query)
        .skip(req.query.skip || 0)
        .countDocuments()
    });
  } catch (err) {
    next(err);
  }
};

export const markNotifications = async (req, res, next) => {
  try {
    console.log("upd views ", req.body);
    for (let _id of req.body) {
      await Notification.updateOne(
        { _id },
        {
          [`reports.${req.user.id}.marked`]: true
        }
      );
    }
    res.json("Notifications updated successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserShorts = async (req, res, next) => {
  try {
    let match;
    if (req.query.id) {
      match = {
        user: req.query.id,
        visibility: "everyone"
      };
    } else {
      await verifyToken(req, {
        _noNext: true
      });
      match = {
        user: req.user.id
      };
    }
    res.json(
      await getAll({
        match,
        model: Short,
        populate: {
          path: "user",
          select: req.query.user_select
        }
      })
    );
  } catch (err) {
    next(err);
  }
};

export const blacklistUserRecommendation = async (req, res, next) => {
  try {
    await User.updateOne(
      {
        _id: req.user.id
      },
      {
        $addToSet: {
          recommendationBlacklist: req.params.userId
        }
      }
    );
    res.json("Blacklisted successfully");
  } catch (err) {
    next(err);
  }
};
